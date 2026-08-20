# APC Inventory — Final System Blueprint (for approval)
_Consolidates Phases 1–16. 59 decisions locked. Approve this before build begins._

## 1. System architecture
- **Web application** (accessible anywhere, Win/Mac/browser) + **database**. Excel/CSV = export only.
- **Stack:** React frontend (Direction A + Figtree) on free hosting (Vercel/Netlify) · **Supabase** = hosted **PostgreSQL** + Auth + row-level security.
- **Auth:** Google sign-in; **authorization by app-level allowlist** (Manager adds emails + role). RLS enforces role access.
- **Scale target:** <100 SKUs, 300–1,500 movements/week, 3–6 users, single location + on-event pool. Free-tier.

## 2. App structure (screens)
Sidebar nav; landing = **Action Hub** (task buttons + alerts) for all.
Home (Action Hub, Dashboard) · Operations (Receive, Record Sale, Returns, Write-off) · Events · Inventory (Current Stock, Expiry Monitor, Transaction History) · Management [Mgr] (Adjustments/Stock Count, Products, Settings, Users, Change Log).

## 3. Data model
Entities: **Product · Batch · Transaction · User · Event · Change Log** + lookups (Category, Unit, Reason) + global settings (`near_expiry_days`=30).
- Product: your SKU codes (unique), managed category/unit, `is_perishable` (default true), pack_size (ref), barcode (reserved), reorder_point (later).
- Batch: keyed by **product + expiry** (merge-by-expiry); auto ID; remaining = **derived**.
- Transaction (source of truth): type, product, batch, positive qty (system signs), effective_date + immutable created_at, user, order_ref, event_id, reason, note, reverses_transaction_id.
- User: Google email, role (Staff / Manager-Admin), is_active.
- Change Log: admin/master-data changes (who/when/what, old→new).

## 4. Transaction model (taxonomy)
IN: RECEIPT, CUSTOMER_RETURN, EVENT_RETURN, ADJUST_IN.
OUT: SALE, EVENT_SALE, SAMPLE, DAMAGE, EXPIRED, CONSUMPTION, SCRAP_RETURN, ADJUST_OUT.
TRANSFER: EVENT_RELEASE, EVENT_RETURN. `event_id` routes an effect to warehouse vs event pool.

## 5. Inventory calculation
- All balances **computed live** = Σ signed transactions. No stored/editable balance.
- **No reservations** (on-hand = available). **Negative stock hard-blocked for everyone.**
- Location-aware: warehouse-available and per-event on-event pool both derived.

## 6. Batch & expiration
- FEFO = earliest **non-expired** batch first, **auto-split** across batches to fill an order.
- **Expired stock excluded from sales** (flagged for write-off; sale blocked if only expired remains).
- Near-expiry = 30 days (editable). Expiry + optional mfg date captured at receipt. Non-perishables use one no-expiry batch.

## 7. Event workflow
Planning → Active → Closed. Release via auto-FEFO (override); record EVENT_SALE/SAMPLE/DAMAGE live or as totals; return remainder.
Reconcile: `released + additional − event_sales − samples − damage − returned = 0`. **Manager-only close; must resolve to 0** (adjustment w/ reason).

## 8. E-commerce sales
v1 = **manual entry** (quick single + multi-line grid); **order_ref required** (duplicate guard + return lookup); auto-FEFO (override). CSV import + API automation (WooCommerce first) = later phases.

## 9. Other movements
Customer Return (order lookup → restock original-else-newest, or scrap). Write-offs (one screen, reason list + note; system-assisted expiry). Adjustments (Manager-only, from stock count, reason required).

## 10. UI/UX & visual design
Direction A "Controlled Signal" (charcoal-led, red as controlled accent) + Figtree. Full token set (light + dark), component specs, WCAG AA, confirmation dialogs on irreversible actions. See docs/06.

## 11. Dashboard & reporting
Action Hub alerts · Manager Dashboard · exportable reports (Excel/CSV, on-demand). Analytics: sales velocity & days-of-stock, top/slow movers, event-vs-online. No valuation v1.

## 12. Automation (thin by design)
Auto batch-ID, FEFO selection, near-expiry/expired flagging, reversing-entry helper, **weekly backup export to Google Drive**.

## 13. Permissions / protection
Two roles (Staff / Manager-Admin) via RLS. Staff: operations + view-only inventory/history. Manager-Admin: + adjustments, event close, products, settings, users, change log.

## 14. Validation rules
No negative stock · positive-only qty (system signs) · perishable ⇒ expiry required · duplicate order_ref guard · required reasons for write-offs/adjustments · immutable transactions.

## 15. Audit trail
Immutable transaction log (user + effective date + created_at) · reversing-entry corrections · Change Log for admin/master-data edits.

## 16. Backup / recovery
Automated **weekly** CSV/SQL export to Google Drive + on-demand export anytime. (Note: revisit cadence if volume grows.)

## 17. Testing plan
Seed cases in docs/08 (event reconciliation, no-negative, FEFO, immutability, duplicate guard, perishable-requires-batch, return split). Expand before/during build.

## 18. Implementation phases (proposed)
1. Foundation: DB schema + Auth + roles + design system shell.
2. Product/Batch master + Receiving.
3. Sales + FEFO + Current Stock.
4. Returns + Write-offs + Expiry Monitor.
5. Adjustments + Stock Count + Change Log.
6. Events (release + reconciliation).
7. Dashboard + Reports/Export + weekly backup.
8. Testing hardening + SOP/docs.

_Approval gate: user must approve this blueprint before full build (Phase 18)._
