# Test Cases & Results

Verified during build against the **live database** (Supabase project) and the **running app in Chrome**.

| # | Scenario | Method | Result |
|---|----------|--------|--------|
| TC1 | **Event reconciliation** — release 100; 35 sold, 10 samples, 3 damaged, 52 returned → unaccounted 0, warehouse back to 52; close blocked until 0 | Live in Chrome (full event) + rolled-back SQL | ✅ Pass |
| TC2 | **No negative stock** — selling more than on hand is refused | Live in Chrome (sold 500 of 100) + trigger test | ✅ Pass — hard-blocked |
| TC3 | **FEFO** — two batches (Sep, Nov); a sale drains earliest-expiry first and auto-splits | Live in Chrome (sold 60 → 40+20) + SQL | ✅ Pass |
| TC4 | **Immutable log** — a saved transaction can't be edited/deleted | Rolled-back SQL (UPDATE blocked) | ✅ Pass |
| TC5 | **Duplicate sale guard** — same order+product refused | `record_sale` guard (code) | ✅ Implemented (guard in RPC) |
| TC6 | **Perishable requires batch/expiry** — receiving a perishable with no expiry is refused | UI enforces required expiry (seen in receiving) + `receive_stock` guard | ✅ Pass (UI + code) |
| TC7 | **Customer return split** — sellable restocks its batch; damaged is scrapped (no restock); return can't exceed sold | Effect math live (restock +, scrap +0) + `customer_return` caps (code) | ✅ Pass (effects) / implemented (caps) |
| TC8 | **Adjustment** — count 90 vs system 100 records ADJUST_OUT 10 with reason, by user | Live in Chrome | ✅ Pass |
| TC9 | **Change log** — product/settings edits auto-logged with who | Live in Chrome + SQL | ✅ Pass |
| TC10 | **Role security (RLS)** — only allowlisted Google emails get in; staff can't adjust | RLS policies + `is_manager()` guards | ✅ Enforced |
| TC11 | **Weekly backup** — snapshot function + pg_cron schedule active | SQL (job active; snapshot works) | ✅ Pass |

**Bugs found & fixed during testing:** FEFO ambiguous `batch_id`; `CASE`→enum cast in `adjust_stock` and `customer_return`; blocking `window.confirm()` replaced with in-app modals.

_Optional follow-up: live walk-throughs of TC5 (duplicate) and TC7 caps can be run in the app anytime._
