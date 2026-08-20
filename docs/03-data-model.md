# Data Model

_Phase 3. This file captures entities, fields, relationships, and rules as we design them._

## Flagged design points (from Phase 1)
- **Products** need a **base unit** and optional **pack size** (mixed units; buy in packs, sell singles).
- Reserve a **barcode** field on products now (scanning is a future feature).
- **Batches** carry expiry (and optional manufacturing date); FEFO uses expiry to pick the batch on sale.
- **Transactions** are immutable; every row is stamped with user + timestamp (audit).
- Balances are **derived** (sum of signed transaction quantities), never stored as an editable field.
- Some products may have **no expiry** — batch/expiry must be optional per product.

## Candidate entities
- Product (SKU) ✅ · Batch/Lot · Transaction · Event · User · Lookups (Category, Unit, Reason) · (later: Supplier, Location, Cost layer)

## Entity: PRODUCT ✅ (locked 2026-08-11)
| Field | Type | Rules |
|---|---|---|
| `product_id` | auto PK | hidden |
| `sku` | text | **user-entered, unique (enforced)** — they have existing codes |
| `name` | text | required |
| `category` | FK → Category lookup | **managed list** |
| `base_unit` | FK → Unit lookup | **managed list** (piece, bottle, box, kg, ml…) |
| `pack_size` | number | optional, reference only |
| `is_perishable` | bool | default **true** (most products expire); if false → no batch/expiry required |
| `barcode` | text | optional, reserved for future scanning |
| `reorder_point` | number | optional; stored now, alerts in later phase |
| `notes` | text | optional |

- No product status field in v1 (all products active — "keep it simple").
- Lookups introduced: **Category**, **Unit** (managed in Settings). Reason-code lookup comes with write-offs/adjustments.

## Entity: BATCH / LOT ✅ (locked 2026-08-11)
| Field | Type | Rules |
|---|---|---|
| `batch_id` | auto PK | human-readable (e.g., SKU123-EXP20261231) |
| `product_id` | FK → Product | |
| `expiry_date` | date | required for perishable; **unique per product** (merge-by-expiry) |
| *remaining_qty* | — | **DERIVED** from transactions (initial receipt + all signed movements); never stored/edited |

- **Grouping:** same product + same expiry = **one merged batch**. A new expiry ⇒ new batch.
- `mfg_date` and `received_date` live on the **RECEIPT transaction** (a merged batch may span multiple receipts). `mfg_date` is **optional**; batch shows earliest received as reference.
- **Non-perishable products:** use a single implicit no-expiry batch so every transaction stays uniformly batch-linked.

## Entity: TRANSACTION ✅ (locked 2026-08-11) — source of truth
| Field | Type | Rules |
|---|---|---|
| `transaction_id` | auto PK | |
| `type` | enum | approved taxonomy (RECEIPT, SALE, EVENT_SALE, SAMPLE, DAMAGE, EXPIRED, CONSUMPTION, CUSTOMER_RETURN, SCRAP_RETURN, EVENT_RELEASE, EVENT_RETURN, ADJUST_IN, ADJUST_OUT) |
| `product_id` | FK | required |
| `batch_id` | FK | required for batched products |
| `quantity` | number > 0 | staff enter **positive**; system applies **+/−** by type |
| `effective_date` | date | **when it happened** (defaults today); staff-settable |
| `created_at` | timestamp | auto, **immutable** audit time |
| `user_id` | FK → User | auto from login (audit) |
| `order_ref` | text | sales only; anchors duplicate guard + return lookup |
| `event_id` | FK → Event | event movements only |
| `reason_code` | FK → Reason | write-offs & adjustments |
| `note` | text | optional |
| `mfg_date` | date | RECEIPT rows only, optional |
| `reverses_transaction_id` | FK → Transaction | set on reversing/correction entries |

- **Immutable:** never edited or deleted. Corrections = automatic **reversing entry** (links via `reverses_transaction_id`).
- **Balances derived:** on-hand(product) = Σ signed quantity; batch remaining = Σ signed quantity for that batch.

## Entity: USER ✅ (locked 2026-08-11)
| Field | Type | Rules |
|---|---|---|
| `user_id` | auto PK | |
| `name` | text | shown in audit trail |
| `email` | text | login identity, unique |
| `role` | enum | **Staff** or **Manager/Admin** |
| `is_active` | bool | disable access without deleting history |

- **Roles:** Staff = daily entry (receive, sell, returns, routine write-offs). Manager/Admin = all that + adjustments, event close, settings, user management.
- **Auth:** Google sign-in via Supabase Auth. **Authorization is app-level:** only emails present in the User table (added by a Manager) may access; role comes from this record. Enforced by Postgres **row-level security** keyed to the signed-in user's role.

## Entity: EVENT ✅ skeleton (locked 2026-08-11; mechanics in Phase 7)
| Field | Type | Rules |
|---|---|---|
| `event_id` | auto PK | |
| `name` | text | required |
| `venue` | text | optional |
| `start_date` / `end_date` | date | event window |
| `status` | enum | Planning → Active → Closed |
| `created_by` | FK → User | |

## Entity: CHANGE_LOG ✅ (admin audit, locked 2026-08-11)
Records master-data & admin changes (separate from the transaction log).
| Field | Type | Notes |
|---|---|---|
| `log_id` | auto PK | |
| `at` | timestamp | when |
| `user_id` | FK → User | who |
| `entity` | text | Product / User / Setting |
| `record_ref` | text | which record |
| `action` | enum | create / edit / deactivate / role-change |
| `field` | text | changed field (if applicable) |
| `old_value` / `new_value` | text | before → after |

## Lookups & Settings (managed in Settings)
- **Category**, **Unit**, **Reason** (write-off/adjustment reasons). Manager/Admin maintains these.
- **Global settings:** `near_expiry_days` (default 30). More may be added later.

## Relationships
```
Product 1─* Batch 1─* Transaction *─1 User
Product 1─────────────* Transaction
Event   1─* Transaction        (event movements only)
Category 1─* Product   Unit 1─* Product   Reason 1─* Transaction
```

## ✅ Phase 3 complete — data model locked (Product, Batch, Transaction, User, Event + lookups)

_Last updated: 2026-08-11._
