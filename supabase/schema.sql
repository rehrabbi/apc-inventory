-- ============================================================================
-- APC Inventory — Database Schema (Supabase / PostgreSQL)
-- Encodes the locked design: immutable transaction log, derived balances,
-- no negative stock, FEFO, batch-by-expiry, events, roles (RLS), audit.
-- Run this in the Supabase SQL Editor on a fresh project.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------- Enums ----------
create type user_role    as enum ('staff','manager');
create type event_status as enum ('planning','active','closed');
create type reason_kind  as enum ('writeoff','adjustment');
create type txn_type as enum (
  -- inbound
  'RECEIPT','CUSTOMER_RETURN','EVENT_RETURN','ADJUST_IN',
  -- outbound
  'SALE','EVENT_SALE','SAMPLE','DAMAGE','EXPIRED','CONSUMPTION','SCRAP_RETURN','ADJUST_OUT',
  -- transfer (event)
  'EVENT_RELEASE'
);

-- ============================================================================
-- Reference / master data
-- ============================================================================
create table profiles (
  id        uuid primary key default gen_random_uuid(),
  email     text unique not null,
  full_name text,
  role      user_role not null default 'staff',
  is_active boolean not null default true,
  auth_uid  uuid unique,                       -- linked to auth.users on first login
  created_at timestamptz not null default now()
);
comment on table profiles is 'App allowlist: only emails a manager adds here may access; role drives permissions.';

create table categories (id uuid primary key default gen_random_uuid(), name text unique not null, is_active boolean default true);
create table units      (id uuid primary key default gen_random_uuid(), name text unique not null);
create table reasons    (id uuid primary key default gen_random_uuid(), label text not null, kind reason_kind not null, is_active boolean default true);
create table settings   (key text primary key, value text not null);

create table products (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique not null,
  name          text not null,
  category_id   uuid references categories(id),
  unit_id       uuid references units(id),
  is_perishable boolean not null default true,
  pack_size     numeric,                 -- reference only
  retail_price  numeric,                 -- retail selling price per unit (reference; drives revenue analytics later)
  barcode       text,                    -- reserved for future scanning
  reorder_point numeric,                 -- alerts in a later phase
  notes         text,
  created_at    timestamptz not null default now()
);

-- Batch: keyed by product + expiry (merge-by-expiry). Remaining is DERIVED (never stored).
create table batches (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id),
  code        text,                       -- human-readable, auto-set
  expiry_date date,                        -- null = non-perishable / no-expiry batch
  lot_code    text,                        -- manufacturer lot / batch number (optional, captured at receiving)
  created_at  timestamptz not null default now()
);
create unique index uq_batch_product_expiry on batches (product_id, expiry_date);
create unique index uq_batch_product_noexpiry on batches (product_id) where expiry_date is null;

create table events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  venue      text,
  start_date date,
  end_date   date,
  status     event_status not null default 'planning',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  closed_at  timestamptz
);

-- ============================================================================
-- Transactions — the immutable source of truth
-- ============================================================================
create table transactions (
  id            uuid primary key default gen_random_uuid(),
  type          txn_type not null,
  product_id    uuid not null references products(id),
  batch_id      uuid not null references batches(id),
  qty           numeric not null check (qty > 0),   -- positive; system applies sign
  effective_date date not null default current_date, -- when it happened
  created_at    timestamptz not null default now(),  -- immutable audit time
  user_id       uuid references profiles(id),
  order_ref     text,                                 -- sales
  event_id      uuid references events(id),           -- event movements
  reason_id     uuid references reasons(id),          -- write-offs / adjustments
  note          text,
  mfg_date      date,                                 -- RECEIPT only
  reverses_transaction_id uuid references transactions(id)
);
create index ix_txn_product on transactions(product_id);
create index ix_txn_batch   on transactions(batch_id);
create index ix_txn_event   on transactions(event_id);
create index ix_txn_order   on transactions(order_ref);
create index ix_txn_type    on transactions(type);

-- Admin / master-data audit (separate from the transaction log)
create table change_log (
  id         uuid primary key default gen_random_uuid(),
  at         timestamptz not null default now(),
  user_id    uuid references profiles(id),
  entity     text not null,
  record_ref text,
  action     text not null,   -- create / edit / delete
  old_value  text,
  new_value  text
);

-- ============================================================================
-- Effect functions: how each transaction type affects warehouse vs event pool
-- (BR15 location routing)
-- ============================================================================
create function txn_wh_mult(t txn_type, has_event boolean) returns integer
  immutable language sql as $$
  select case t
    when 'RECEIPT' then 1 when 'CUSTOMER_RETURN' then 1 when 'ADJUST_IN' then 1 when 'EVENT_RETURN' then 1
    when 'SALE' then -1 when 'EXPIRED' then -1 when 'CONSUMPTION' then -1 when 'ADJUST_OUT' then -1
    when 'EVENT_RELEASE' then -1
    when 'SAMPLE' then case when has_event then 0 else -1 end
    when 'DAMAGE' then case when has_event then 0 else -1 end
    else 0 end;              -- EVENT_SALE, SCRAP_RETURN -> 0 warehouse effect
$$;

create function txn_ev_mult(t txn_type) returns integer
  immutable language sql as $$
  select case t
    when 'EVENT_RELEASE' then 1
    when 'EVENT_RETURN' then -1
    when 'EVENT_SALE' then -1
    when 'SAMPLE' then -1
    when 'DAMAGE' then -1
    else 0 end;
$$;

-- ============================================================================
-- Derived-balance views (BR1/BR13: balances are computed, never stored)
-- ============================================================================
create view v_warehouse_stock as
  select product_id, batch_id,
         sum(qty * txn_wh_mult(type, event_id is not null))::numeric as on_hand
  from transactions group by product_id, batch_id;

create view v_product_stock as
  select product_id,
         sum(qty * txn_wh_mult(type, event_id is not null))::numeric as on_hand
  from transactions group by product_id;

create view v_event_stock as
  select event_id, product_id, batch_id,
         sum(qty * txn_ev_mult(type))::numeric as on_event
  from transactions where event_id is not null
  group by event_id, product_id, batch_id;

create function near_expiry_days() returns integer stable language sql as $$
  select coalesce((select value::int from settings where key='near_expiry_days'), 30);
$$;

create view v_batch_status as
  select b.id as batch_id, b.product_id, b.code, b.expiry_date,
         coalesce(w.on_hand,0) as on_hand,
         case
           when b.expiry_date is null then 'none'
           when b.expiry_date < current_date then 'expired'
           when b.expiry_date <= current_date + (near_expiry_days() || ' days')::interval then 'near'
           else 'ok'
         end as expiry_state,
         b.lot_code
  from batches b
  left join v_warehouse_stock w on w.batch_id = b.id;

-- ============================================================================
-- Integrity triggers
-- ============================================================================
-- BR3: transactions are immutable (corrections = reversing entries)
create function block_txn_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Transactions are immutable. Post a reversing entry instead of editing/deleting.';
end $$;
create trigger trg_txn_no_update before update on transactions for each row execute function block_txn_mutation();
create trigger trg_txn_no_delete before delete on transactions for each row execute function block_txn_mutation();

-- BR2: no negative stock (warehouse or event pool), hard-blocked for everyone
create function enforce_stock() returns trigger language plpgsql as $$
declare cur numeric;
begin
  if txn_wh_mult(new.type, new.event_id is not null) < 0 then
    select coalesce(sum(qty * txn_wh_mult(type, event_id is not null)),0) into cur
      from transactions where batch_id = new.batch_id;
    if cur - new.qty < 0 then
      raise exception 'Insufficient stock for batch %: on hand %, requested %.', new.batch_id, cur, new.qty;
    end if;
  end if;
  if new.event_id is not null and txn_ev_mult(new.type) < 0 then
    select coalesce(sum(qty * txn_ev_mult(type)),0) into cur
      from transactions where event_id = new.event_id and batch_id = new.batch_id;
    if cur - new.qty < 0 then
      raise exception 'Insufficient event stock for batch % at event %: on event %, requested %.', new.batch_id, new.event_id, cur, new.qty;
    end if;
  end if;
  return new;
end $$;
create trigger trg_enforce_stock before insert on transactions for each row execute function enforce_stock();

-- Auto human-readable batch code
create function set_batch_code() returns trigger language plpgsql as $$
declare s text;
begin
  select sku into s from products where id = new.product_id;
  new.code := s || '-' || coalesce(to_char(new.expiry_date,'YYYYMMDD'),'NOEXP');
  return new;
end $$;
create trigger trg_batch_code before insert on batches for each row execute function set_batch_code();

-- ============================================================================
-- Auth helpers (used by RLS)
-- ============================================================================
create function is_app_user() returns boolean stable security definer language sql as $$
  select exists(select 1 from profiles where auth_uid = auth.uid() and is_active);
$$;
create function is_manager() returns boolean stable security definer language sql as $$
  select exists(select 1 from profiles where auth_uid = auth.uid() and is_active and role = 'manager');
$$;
-- The single owner account (settings.owner_email) allowed to run destructive admin actions.
create function is_owner() returns boolean stable security definer set search_path = public language sql as $$
  select exists(
    select 1 from profiles p
    where p.auth_uid = auth.uid() and p.is_active
      and lower(p.email) = lower(coalesce((select value from settings where key = 'owner_email'), ''))
  );
$$;
revoke execute on function is_owner() from public, anon;
grant  execute on function is_owner() to authenticated;
create function my_profile_id() returns uuid stable security definer language sql as $$
  select id from profiles where auth_uid = auth.uid();
$$;

-- Link a Google-authenticated user to their pre-added allowlist profile (by email).
create function link_my_profile() returns void security definer language plpgsql as $$
begin
  update profiles
     set auth_uid = auth.uid()
   where auth_uid is null
     and lower(email) = lower(auth.jwt() ->> 'email');
end $$;

-- ============================================================================
-- Server-side operations (integrity centralised)
-- ============================================================================
-- Receiving: find-or-create batch (merge by expiry) + RECEIPT
create function receive_stock(p_product uuid, p_qty numeric, p_expiry date,
                              p_mfg date default null, p_effective date default current_date,
                              p_lot text default null)
  returns void security definer set search_path = public language plpgsql as $$
declare v_batch uuid;
begin
  if not is_app_user() then raise exception 'Not authorised.'; end if;
  if (select is_perishable from products where id = p_product) and p_expiry is null then
    raise exception 'This product is perishable; an expiry date is required.';
  end if;
  select id into v_batch from batches
    where product_id = p_product and expiry_date is not distinct from p_expiry;
  if v_batch is null then
    insert into batches(product_id, expiry_date, lot_code)
    values (p_product, p_expiry, nullif(trim(p_lot), '')) returning id into v_batch;
  elsif nullif(trim(p_lot), '') is not null then
    update batches set lot_code = trim(p_lot) where id = v_batch and coalesce(lot_code, '') = '';
  end if;
  insert into transactions(type, product_id, batch_id, qty, effective_date, user_id, mfg_date)
  values ('RECEIPT', p_product, v_batch, p_qty, p_effective, my_profile_id(), p_mfg);
end $$;

-- FEFO allocation: earliest NON-expired batches with available stock, auto-split (BR6/BR16)
create function fefo_allocate(p_product uuid, p_qty numeric)
  returns table(batch_id uuid, take numeric) language plpgsql as $$
declare remaining numeric := p_qty; r record; avail numeric;
begin
  for r in
    select b.id from batches b
    where b.product_id = p_product
      and (b.expiry_date is null or b.expiry_date >= current_date)   -- exclude expired
    order by b.expiry_date asc nulls last, b.created_at asc
  loop
    exit when remaining <= 0;
    select coalesce(sum(t.qty * txn_wh_mult(t.type, t.event_id is not null)),0) into avail
      from transactions t where t.batch_id = r.id;   -- qualify to avoid clash with OUT param batch_id
    if avail > 0 then
      batch_id := r.id; take := least(avail, remaining);
      remaining := remaining - take; return next;
    end if;
  end loop;
  if remaining > 0 then
    raise exception 'Not enough sellable (non-expired) stock for %: short by % unit(s).',
      (select sku from products where id = p_product), remaining;
  end if;
end $$;

-- Record an online sale via FEFO (duplicate-order guard). Event sales handled in Stage 6.
create function record_sale(p_product uuid, p_qty numeric, p_order_ref text,
                            p_effective date default current_date)
  returns void security definer language plpgsql as $$
declare a record;
begin
  if not is_app_user() then raise exception 'Not authorised.'; end if;
  if p_order_ref is not null and exists(
        select 1 from transactions where type='SALE' and order_ref = p_order_ref and product_id = p_product) then
    raise exception 'Duplicate sale: order % already recorded for this product.', p_order_ref;
  end if;
  for a in select * from fefo_allocate(p_product, p_qty) loop
    insert into transactions(type, product_id, batch_id, qty, effective_date, user_id, order_ref)
    values ('SALE', p_product, a.batch_id, a.take, p_effective, my_profile_id(), p_order_ref);
  end loop;
end $$;

-- Write-off: DAMAGE / EXPIRED / CONSUMPTION / SAMPLE against a specific batch
create function write_off(p_product uuid, p_batch uuid, p_type text, p_qty numeric,
                          p_note text default null, p_effective date default current_date)
  returns void security definer set search_path = public language plpgsql as $$
begin
  if not is_app_user() then raise exception 'Not authorised.'; end if;
  if p_type not in ('DAMAGE','EXPIRED','CONSUMPTION','SAMPLE') then
    raise exception 'Invalid write-off type: %', p_type;
  end if;
  insert into transactions(type, product_id, batch_id, qty, effective_date, user_id, note)
  values (p_type::txn_type, p_product, p_batch, p_qty, p_effective, my_profile_id(), p_note);
end $$;

-- Customer return: look up the order, restock (sellable) or scrap (not sellable)
create function customer_return(p_order_ref text, p_product uuid, p_qty numeric, p_sellable boolean,
                                p_note text default null, p_effective date default current_date)
  returns void security definer set search_path = public language plpgsql as $$
declare v_batch uuid; sold numeric; returned numeric;
begin
  if not is_app_user() then raise exception 'Not authorised.'; end if;
  select coalesce(sum(qty),0) into sold from transactions
    where type='SALE' and order_ref = p_order_ref and product_id = p_product;
  if sold <= 0 then raise exception 'No sale found for order % with this product.', p_order_ref; end if;
  select coalesce(sum(qty),0) into returned from transactions
    where type in ('CUSTOMER_RETURN','SCRAP_RETURN') and order_ref = p_order_ref and product_id = p_product;
  if p_qty > sold - returned then
    raise exception 'Return exceeds what was sold on order % (sold %, already returned %).', p_order_ref, sold, returned;
  end if;
  select batch_id into v_batch from transactions
    where type='SALE' and order_ref = p_order_ref and product_id = p_product order by created_at asc limit 1;
  if v_batch is null then
    select id into v_batch from batches where product_id = p_product order by created_at desc limit 1;
  end if;
  insert into transactions(type, product_id, batch_id, qty, effective_date, user_id, order_ref, note)
  values ((case when p_sellable then 'CUSTOMER_RETURN' else 'SCRAP_RETURN' end)::txn_type,
          p_product, v_batch, p_qty, p_effective, my_profile_id(), p_order_ref, p_note);
end $$;

-- Manager-only stock adjustment: reconcile a batch to a counted quantity
create function adjust_stock(p_product uuid, p_batch uuid, p_actual numeric, p_reason uuid,
                            p_note text default null, p_effective date default current_date)
  returns void security definer set search_path = public language plpgsql as $$
declare cur numeric; diff numeric;
begin
  if not is_manager() then raise exception 'Only a manager can adjust stock.'; end if;
  select coalesce(sum(t.qty * txn_wh_mult(t.type, t.event_id is not null)),0) into cur
    from transactions t where t.batch_id = p_batch;
  diff := p_actual - cur;
  if diff = 0 then raise exception 'No change needed: counted quantity already matches system (%).', cur; end if;
  insert into transactions(type, product_id, batch_id, qty, effective_date, user_id, reason_id, note)
  values ((case when diff > 0 then 'ADJUST_IN' else 'ADJUST_OUT' end)::txn_type,
          p_product, p_batch, abs(diff), p_effective, my_profile_id(), p_reason, p_note);
end $$;

-- Change log for master data & profiles
create function log_change_generic() returns trigger security definer set search_path = public language plpgsql as $$
begin
  insert into change_log(user_id, entity, record_ref, action, old_value, new_value)
  values (my_profile_id(), tg_table_name,
          coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id', to_jsonb(new)->>'key', to_jsonb(old)->>'key'),
          lower(tg_op),
          case when tg_op <> 'INSERT' then to_jsonb(old)::text end,
          case when tg_op <> 'DELETE' then to_jsonb(new)::text end);
  return coalesce(new, old);
end $$;
create function log_change_profile() returns trigger security definer set search_path = public language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.role = new.role and old.is_active = new.is_active
     and old.email = new.email and coalesce(old.full_name,'') = coalesce(new.full_name,'') then
    return new;  -- skip auth_uid linking on login
  end if;
  insert into change_log(user_id, entity, record_ref, action, old_value, new_value)
  values (my_profile_id(), 'profiles', coalesce(new.id, old.id)::text, lower(tg_op),
          case when tg_op <> 'INSERT' then to_jsonb(old)::text end,
          case when tg_op <> 'DELETE' then to_jsonb(new)::text end);
  return coalesce(new, old);
end $$;
create trigger trg_log_products after insert or update or delete on products for each row execute function log_change_generic();
create trigger trg_log_settings after insert or update or delete on settings for each row execute function log_change_generic();
create trigger trg_log_profiles after insert or update or delete on profiles for each row execute function log_change_profile();

-- Grants for adjust_stock
revoke execute on function adjust_stock(uuid, uuid, numeric, uuid, text, date) from public, anon;
grant  execute on function adjust_stock(uuid, uuid, numeric, uuid, text, date) to authenticated;

-- ============================================================================
-- Event workflow
-- ============================================================================
create function event_fefo_allocate(p_event uuid, p_product uuid, p_qty numeric)
  returns table(batch_id uuid, take numeric) language plpgsql set search_path = public as $$
declare remaining numeric := p_qty; r record; avail numeric;
begin
  for r in select b.id from batches b where b.product_id = p_product
           order by b.expiry_date asc nulls last, b.created_at asc
  loop
    exit when remaining <= 0;
    select coalesce(sum(t.qty * txn_ev_mult(t.type)),0) into avail
      from transactions t where t.event_id = p_event and t.batch_id = r.id;
    if avail > 0 then batch_id := r.id; take := least(avail, remaining); remaining := remaining - take; return next; end if;
  end loop;
  if remaining > 0 then
    raise exception 'Not enough of % in the event pool: short by % unit(s).', (select sku from products where id = p_product), remaining;
  end if;
end $$;

create function event_release(p_event uuid, p_product uuid, p_qty numeric, p_effective date default current_date)
  returns void security definer set search_path = public language plpgsql as $$
declare a record;
begin
  if not is_app_user() then raise exception 'Not authorised.'; end if;
  if (select status from events where id = p_event) <> 'active' then raise exception 'Event is not active.'; end if;
  for a in select * from fefo_allocate(p_product, p_qty) loop
    insert into transactions(type, product_id, batch_id, qty, effective_date, user_id, event_id)
    values ('EVENT_RELEASE', p_product, a.batch_id, a.take, p_effective, my_profile_id(), p_event);
  end loop;
end $$;

create function event_consume(p_event uuid, p_product uuid, p_qty numeric, p_type text, p_effective date default current_date)
  returns void security definer set search_path = public language plpgsql as $$
declare a record;
begin
  if not is_app_user() then raise exception 'Not authorised.'; end if;
  if p_type not in ('EVENT_SALE','SAMPLE','DAMAGE') then raise exception 'Invalid event movement: %', p_type; end if;
  if (select status from events where id = p_event) <> 'active' then raise exception 'Event is not active.'; end if;
  for a in select * from event_fefo_allocate(p_event, p_product, p_qty) loop
    insert into transactions(type, product_id, batch_id, qty, effective_date, user_id, event_id)
    values (p_type::txn_type, p_product, a.batch_id, a.take, p_effective, my_profile_id(), p_event);
  end loop;
end $$;

create function event_return(p_event uuid, p_product uuid, p_qty numeric, p_effective date default current_date)
  returns void security definer set search_path = public language plpgsql as $$
declare a record;
begin
  if not is_app_user() then raise exception 'Not authorised.'; end if;
  if (select status from events where id = p_event) <> 'active' then raise exception 'Event is not active.'; end if;
  for a in select * from event_fefo_allocate(p_event, p_product, p_qty) loop
    insert into transactions(type, product_id, batch_id, qty, effective_date, user_id, event_id)
    values ('EVENT_RETURN', p_product, a.batch_id, a.take, p_effective, my_profile_id(), p_event);
  end loop;
end $$;

create function close_event(p_event uuid) returns void security definer set search_path = public language plpgsql as $$
declare rem numeric;
begin
  if not is_manager() then raise exception 'Only a manager can close an event.'; end if;
  select coalesce(sum(t.qty * txn_ev_mult(t.type)),0) into rem from transactions t where t.event_id = p_event;
  if rem <> 0 then raise exception 'Cannot close: % unit(s) still unaccounted. Record returns or losses until the pool is zero.', rem; end if;
  update events set status = 'closed', closed_at = now() where id = p_event;
end $$;

create view v_event_reconcile as
  select event_id, product_id,
    coalesce(sum(qty) filter (where type='EVENT_RELEASE'),0) as released,
    coalesce(sum(qty) filter (where type='EVENT_SALE'),0)    as sold,
    coalesce(sum(qty) filter (where type='SAMPLE'),0)        as samples,
    coalesce(sum(qty) filter (where type='DAMAGE'),0)        as damage,
    coalesce(sum(qty) filter (where type='EVENT_RETURN'),0)  as returned,
    coalesce(sum(qty * txn_ev_mult(type)),0)                 as remaining
  from transactions where event_id is not null
  group by event_id, product_id;
alter view v_event_reconcile set (security_invoker = on);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table profiles     enable row level security;
alter table categories   enable row level security;
alter table units        enable row level security;
alter table reasons      enable row level security;
alter table settings     enable row level security;
alter table products     enable row level security;
alter table batches      enable row level security;
alter table events       enable row level security;
alter table transactions enable row level security;
alter table change_log   enable row level security;

-- Read access for any active app user
create policy read_app on profiles     for select using (is_app_user());
create policy read_app on categories   for select using (is_app_user());
create policy read_app on units        for select using (is_app_user());
create policy read_app on reasons      for select using (is_app_user());
create policy read_app on settings     for select using (is_app_user());
create policy read_app on products     for select using (is_app_user());
create policy read_app on batches      for select using (is_app_user());
create policy read_app on events       for select using (is_app_user());
create policy read_app on transactions for select using (is_app_user());
create policy read_mgr on change_log   for select using (is_manager());

-- Master data: managers manage
create policy write_mgr on products   for all using (is_manager()) with check (is_manager());
create policy write_mgr on categories for all using (is_manager()) with check (is_manager());
create policy write_mgr on units      for all using (is_manager()) with check (is_manager());
create policy write_mgr on reasons    for all using (is_manager()) with check (is_manager());
create policy write_mgr on settings   for all using (is_manager()) with check (is_manager());
create policy write_mgr on profiles   for all using (is_manager()) with check (is_manager());

-- Batches: any app user may create (part of receiving); no edits/deletes
create policy insert_app on batches for insert with check (is_app_user());

-- Events: app users create/update; closing is guarded in app/Stage 6
create policy insert_app on events for insert with check (is_app_user());
create policy update_app on events for update using (is_app_user()) with check (is_app_user());

-- Transactions: app users insert; adjustments are manager-only; never update/delete
create policy insert_txn on transactions for insert with check (
  is_app_user() and (type not in ('ADJUST_IN','ADJUST_OUT') or is_manager())
);

-- ============================================================================
-- Seed
-- ============================================================================
insert into settings(key, value) values ('near_expiry_days','30');
insert into settings(key, value) values ('owner_email','apc.ai.opex@gmail.com');
insert into units(name) values ('piece'),('bottle'),('box'),('pack'),('kg'),('ml');
insert into categories(name) values ('Skincare'),('Supplements'),('Beverage'),('Food'),('Other');
insert into reasons(label, kind) values
  ('Damaged','writeoff'),('Lost','writeoff'),('Expired','writeoff'),
  ('Internal use','writeoff'),('Sample / giveaway','writeoff'),
  ('Stock count correction','adjustment'),('Data entry error','adjustment');

-- ============================================================================
-- Analytics & backup
-- ============================================================================
create view v_sales_30d as
  select product_id, sum(qty) as sold_30d
  from transactions
  where type in ('SALE','EVENT_SALE') and effective_date >= current_date - 30
  group by product_id;
alter view v_sales_30d set (security_invoker = on);

create table backups (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  data jsonb not null
);
alter table backups enable row level security;
create policy read_mgr on backups for select using (is_manager());

create function make_backup() returns void language plpgsql security definer set search_path = public as $$
begin
  insert into backups(data) values (jsonb_build_object(
    'taken_at', now(),
    'products',     (select coalesce(jsonb_agg(p), '[]') from products p),
    'batches',      (select coalesce(jsonb_agg(b), '[]') from batches b),
    'transactions', (select coalesce(jsonb_agg(t), '[]') from transactions t),
    'events',       (select coalesce(jsonb_agg(e), '[]') from events e),
    'profiles',     (select coalesce(jsonb_agg(pr),'[]') from profiles pr),
    'change_log',   (select coalesce(jsonb_agg(c), '[]') from change_log c),
    'settings',     (select coalesce(jsonb_agg(s), '[]') from settings s)
  ));
  delete from backups where at < now() - interval '90 days';
end $$;
revoke execute on function make_backup() from public, anon;
grant  execute on function make_backup() to authenticated;

-- ============================================================================
-- Owner danger zone (owner-only, destructive; each takes a backup first)
-- ============================================================================
create function admin_reset_activity() returns void
  security definer set search_path = public language plpgsql as $$
begin
  if not is_owner() then raise exception 'Only the owner can reset activity.'; end if;
  perform make_backup();
  alter table transactions disable trigger trg_txn_no_delete;
  delete from transactions where true;
  alter table transactions enable trigger trg_txn_no_delete;
  delete from batches where true;
  delete from events where true;
end $$;
revoke execute on function admin_reset_activity() from public, anon;
grant  execute on function admin_reset_activity() to authenticated;

create function admin_delete_event(p_event uuid) returns void
  security definer set search_path = public language plpgsql as $$
begin
  if not is_owner() then raise exception 'Only the owner can delete events.'; end if;
  perform make_backup();
  alter table transactions disable trigger trg_txn_no_delete;
  delete from transactions where event_id = p_event;
  alter table transactions enable trigger trg_txn_no_delete;
  delete from events where id = p_event;
end $$;
revoke execute on function admin_delete_event(uuid) from public, anon;
grant  execute on function admin_delete_event(uuid) to authenticated;

-- Weekly automated backup (Sundays 02:00). Requires pg_cron (enable in Supabase → Database → Extensions).
-- create extension if not exists pg_cron with schema extensions;
-- select cron.schedule('weekly-backup', '0 2 * * 0', $$ select make_backup() $$);
-- Note: for off-site copies, download a backup from the app and save to Google Drive, or add a
--       Drive-push edge function later.

-- ============================================================================
-- Security hardening (applied as migration 'harden_security')
-- ============================================================================
-- Balance views enforce the querying user's RLS
alter view v_warehouse_stock set (security_invoker = on);
alter view v_product_stock  set (security_invoker = on);
alter view v_event_stock    set (security_invoker = on);
alter view v_batch_status   set (security_invoker = on);

-- Pin search_path on all functions
alter function txn_wh_mult(txn_type, boolean) set search_path = public;
alter function txn_ev_mult(txn_type)          set search_path = public;
alter function near_expiry_days()             set search_path = public;
alter function block_txn_mutation()           set search_path = public;
alter function enforce_stock()                set search_path = public;
alter function set_batch_code()               set search_path = public;
alter function is_app_user()                  set search_path = public;
alter function is_manager()                   set search_path = public;
alter function my_profile_id()                set search_path = public;
alter function link_my_profile()              set search_path = public;
alter function receive_stock(uuid, numeric, date, date, date, text) set search_path = public;
alter function fefo_allocate(uuid, numeric)   set search_path = public;
alter function record_sale(uuid, numeric, text, date)         set search_path = public;

-- Restrict mutating/auth functions to signed-in users only
revoke execute on function link_my_profile()                         from public, anon;
revoke execute on function receive_stock(uuid, numeric, date, date, date, text) from public, anon;
revoke execute on function record_sale(uuid, numeric, text, date)    from public, anon;
grant  execute on function link_my_profile()                         to authenticated;
grant  execute on function receive_stock(uuid, numeric, date, date, date, text) to authenticated;
grant  execute on function record_sale(uuid, numeric, text, date)    to authenticated;

-- Tighten function EXECUTE grants (least privilege on the exposed API)
-- RLS helpers: authenticated only (used by RLS), never anon
revoke execute on function is_app_user() from anon;
revoke execute on function is_manager() from anon;
-- Internal / trigger-only functions: owner only (run via triggers or SECURITY DEFINER RPCs)
revoke execute on function my_profile_id()       from anon, authenticated;
revoke execute on function log_change_generic()  from anon, authenticated;
revoke execute on function log_change_profile()  from anon, authenticated;
-- View helpers: authenticated only (used by security_invoker views), never anon
revoke execute on function txn_wh_mult(txn_type, boolean) from anon;
revoke execute on function txn_ev_mult(txn_type)          from anon;
revoke execute on function near_expiry_days()             from anon;

-- NOTE: first manager was added via:
-- insert into profiles(email, full_name, role) values ('apc.ai.opex@gmail.com','Jireh','manager');
