# Workflow Map

_Phase 2 in progress. Each workflow is traced as: trigger → steps → transaction(s) produced → validations → result._

## Transaction taxonomy (✅ APPROVED 2026-08-11)
Every stock movement is one transaction with a **type**, a **signed quantity**, and links to product + batch + (optional) event.

**INBOUND (+)**
- `RECEIPT` — supplier delivery / stock received (creates or adds to a batch)
- `CUSTOMER_RETURN` — sellable item returned by a customer, put back to stock
- `EVENT_RETURN` — unsold stock coming back from an event
- `ADJUST_IN` — positive correction (count found, error fix)

**OUTBOUND (−)**
- `SALE` — e-commerce sale (online)
- `EVENT_SALE` — sale made at an event (tracked separately from online sales; links to the event)
- `SAMPLE` — sample / giveaway
- `DAMAGE` — damaged / lost
- `EXPIRED` — expired write-off
- `CONSUMPTION` — internal use
- `SCRAP_RETURN` — customer return that is not resellable (damaged) → written off
- `ADJUST_OUT` — negative correction

**TRANSFER / TEMPORARY (event; single-location so no warehouse-to-warehouse yet)**
- `EVENT_RELEASE` — stock sent out to an event (warehouse → "on event")
- `EVENT_RETURN` — remaining stock returned (on event → warehouse) _(also listed as inbound view)_

> Event modeling detail (transfer/location model vs reconciliation-document) is decided in Phase 7.
> Location-to-location transfer type is omitted for now (single location) but the design keeps room for it.

## W1 — Stock Receiving ✅
**Trigger:** supplier delivery arrives.
**Steps:** open Receive Stock → select SKU → enter batch details → validate → save.
**Batch identity:** system **auto-generates** a unique batch ID (e.g., SKU-YYYYMMDD-seq).
**Supplier:** not tracked in v1 (can add a Supplier entity later).
**Quantity:** entered in **base units** directly (no pack conversion needed at receipt).
**Dates:** capture **expiry + manufacturing date** for perishables (both). Non-perishable products skip batch/expiry.
**Produces:** BATCH record (if new) + `RECEIPT` transaction (+qty), stamped user+timestamp.
**Validations:** valid SKU · qty > 0 · perishable ⇒ expiry required · duplicate-receipt guard.

## W2 — E-commerce Sale ✅
**Trigger:** online order recorded manually (v1).
**Steps:** open Record Sale → select SKU + qty → system auto-picks batch by **FEFO (override allowed)** → validate → save.
**Order reference:** **always required** → anchors duplicate guard + traceability.
**Entry:** support **both** a fast multi-line batch-entry grid AND quick single-order entry.
**Produces:** `SALE` transaction (−qty) against chosen batch, user+timestamp.
**Validations:** block if would go negative · duplicate order-ref guard · qty > 0.
**Deferred to Phase 6:** multi-batch split rules when one order exceeds a single batch's remaining.

## W3 — Customer Return ✅
**Trigger:** customer sends item(s) back.
**Steps:** look up the **original order** → confirm condition.
**If resellable:** `CUSTOMER_RETURN` (+), restock to **original batch if known, else newest**.
**If not resellable:** `SCRAP_RETURN` (−, written off), with reason.
**Validations:** order lookup, condition required, qty ≤ original order qty.

## W4 — Write-offs (Damage / Expired / Consumption / Sample) ✅
**Trigger:** staff report units to remove (or system flags expiry).
**Steps:** select product + batch + qty + **reason (predefined list + optional note)** → save outbound.
**Expired:** **system-assisted** — system flags expired batches and offers one-click `EXPIRED` write-off of the expired qty.
**Produces:** `DAMAGE` / `EXPIRED` / `CONSUMPTION` / `SAMPLE` (−) against the batch, user+timestamp.

## W5 — Adjustments / Corrections ✅
**Trigger:** physical reality ≠ system (mainly from a **physical stock count**).
**Rights:** **manager/admin only** (most sensitive action; addresses pain point #4).
**Steps:** count-and-reconcile → per product/batch, enter corrected figure → **reason required (predefined + note)** → `ADJUST_IN`/`ADJUST_OUT`.
**Produces:** signed adjustment transaction, permanent audit row (who/why).
**Also supports:** ad-hoc single corrections (same rules).

## W6 — Event Release + Reconciliation ✅ (Phase 7)
**Lifecycle:** Planning → Active → Closed. Model event stock as a temporary "on-event" pool (per event), enabling a **live view**.
**Release:** enter product + qty → **auto-FEFO picks batches (override allowed)** → `EVENT_RELEASE` (−warehouse, +event pool). Additional releases allowed while Active.
**During event:** record `EVENT_SALE`, `SAMPLE` (event-tagged), `DAMAGE` (event-tagged) → each (−event pool). Entry supported **both live and as end-of-event totals**.
**Return:** physically count remainder → `EVENT_RETURN` (+warehouse, −event pool).
**Reconciliation identity:** `released + additional − event_sales − samples − damage − returned = unaccounted`.
**Close (Manager/Admin only):** **unaccounted must be resolved to 0** first — a manager records an adjustment (reason required) for any discrepancy; then the event closes.

### Location-effect map (finalizes BR15)
| Type | Warehouse | Event pool |
|---|:--:|:--:|
| RECEIPT | +| |
| SALE, DAMAGE/EXPIRED/CONSUMPTION/SAMPLE (no event) | − | |
| CUSTOMER_RETURN | + | |
| SCRAP_RETURN | (write-off, no restock) | |
| ADJUST_IN / ADJUST_OUT | ± | (± event if event-tagged) |
| EVENT_RELEASE | − | + |
| EVENT_RETURN | + | − |
| EVENT_SALE, SAMPLE/DAMAGE (event-tagged) | | − |

_An `event_id` on the transaction is what routes an effect to the event pool vs the warehouse._

## ✅ Phase 7 complete — event workflow fully designed

_Last updated: 2026-08-11._
