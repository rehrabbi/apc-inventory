# Business Rules

_Candidate rules gathered as we design. Finalized across Phases 5–7, 15._

## Inventory integrity (from north stars 1 & 4)
- BR1 — Stock balance = sum of signed transaction quantities for a product/batch. Never manually overwritten.
- BR2 — A transaction that would drive on-hand negative is **hard-blocked for everyone** with a clear message (no negative inventory). Real discrepancies are corrected via a manager Adjustment.
- BR13 — Balances are **computed live** from the transaction log on demand (no stored running total in v1; may add snapshots only if scale ever demands).
- BR14 — **No reservations in v1:** on-hand = available. Stock counts as available until it physically moves (sale or event release).
- BR15 — Balances are **location-aware:** warehouse-available and per-event on-event stock are both derived from the log (event location math finalized in Phase 7).
- BR3 — Transactions are **immutable** once saved (never edited/deleted). Corrections = an automatic **reversing entry** linked via `reverses_transaction_id`.
- BR4 — Every transaction records: who (user), entry time (`created_at`, immutable), **effective date** (settable, defaults today), type, product, batch (if applicable), quantity, reason/note.
- BR12 — Quantity is entered as a **positive** number; the system applies the +/− sign from the transaction type (prevents sign errors).

## Batch & expiry (north star 2)
- BR5 — Products flagged as perishable **require a batch with an expiry** on receipt.
- BR6 — Sales/outbound deduct by **FEFO** = earliest **non-expired** batch first; **auto-split** across batches until the quantity is filled (each split logged per batch). Manual override limited to non-expired batches.
- BR7 — **Near-expiry threshold = global setting, default 30 days** (editable in Settings). Near-expiry and expired stock surfaced as alerts on the Action Hub / Dashboard / Expiry Monitor.
- BR16 — **Expired batches are excluded from sales.** If only expired stock remains, the sale is treated as out-of-stock (blocked) and the expired units are flagged for write-off.

## Events (north star 3)
- BR8 — Event reconciliation must balance:
  `released + additional − event_sales − samples − damage − returned = unaccounted (should be 0)`.
- BR9 — An event **cannot close** with non-zero unaccounted; a Manager/Admin must post an adjustment (reason required) to resolve it first. Only Manager/Admin can close an event.
- BR17 — Event releases use **auto-FEFO (override allowed)** to choose batches, same as sales.
- BR18 — Event movements may be entered **live or as end-of-event totals**; both feed the same reconciliation.
- BR15 — Location routing: a transaction's `event_id` (present or not) plus its type determines whether it affects **warehouse** or the **event pool** (see location-effect map in workflow doc).

## Audit & backup
- BR19 — Master-data & admin changes (product edits, user/role changes, settings) are recorded in a **Change Log** (who/when/what, old→new), separate from the transaction log.
- BR20 — **Automated weekly export** (CSV/SQL) to Google Drive as backup (free-tier has no managed backups). On-demand export also available anytime.

## Duplicates & validation
- BR10 — Guard against duplicate sales entries (same order reference).
- BR11 — Invalid SKU / missing required batch / non-positive quantity are rejected at entry.

_Last updated: 2026-08-11._
