# App Blueprint ✅ (locked 2026-08-11, Phase 4)

## Navigation
- **Left sidebar**, grouped by area (persistent). Groups: Home · Operations · Inventory · Events · Management.
- **Landing screen for all users:** 🏠 **Action Hub** — big task buttons (Receive · Sell · Return · Write-off) + an **alert strip** (low stock, near-expiry, expired, open events).
- Analytics **Dashboard** is a separate screen (managers' primary view), reachable from the sidebar.

## Screens, responsibilities & role access
| Group | Screen | Responsibility | Staff | Mgr/Admin |
|---|---|---|:--:|:--:|
| Home | 🏠 Action Hub (landing) | Task buttons + alerts | ✅ | ✅ |
| Home | 📊 Dashboard | KPIs, stock health, charts | 👁️ | ✅ |
| Operations | 📥 Receive Stock | Inbound → batch + RECEIPT | ✅ | ✅ |
| Operations | 🛒 Record Sale | Outbound, auto-FEFO, order ref; single + multi-line | ✅ | ✅ |
| Operations | ↩️ Customer Returns | Order lookup → restock or scrap | ✅ | ✅ |
| Operations | 🗑️ Write-off | **One screen**, type/reason picker (damage/expired/consumption/sample) | ✅ | ✅ |
| Events | 📦 Events | List → detail: release, live stock, reconcile; **close = Mgr only** | ✅ (release/sell) | ✅ |
| Inventory | 📊 Current Stock | On-hand by product → drill to batches | 👁️ view | ✅ |
| Inventory | ⏳ Expiry Monitor | Near-expiry & expired; one-click write-off | 👁️ view | ✅ |
| Inventory | 🧾 Transaction History | Audit log, filter, **export Excel/CSV** | 👁️ view | ✅ |
| Management | ⚖️ Adjustments / Stock Count | Count-and-reconcile corrections | ❌ | ✅ only |
| Management | 🏷️ Products | SKU master add/edit | ❌ | ✅ |
| Management | ⚙️ Settings | Lookups: category, unit, reason | ❌ | ✅ |
| Management | 👥 Users | Accounts & roles | ❌ | ✅ |

Legend: ✅ full · 👁️ view-only · ❌ hidden.

## Dashboard & Reporting ✅ (Phase 13)
**Three surfaces:**
1. **Action Hub alerts** (all users): expired-needing-write-off · near-expiry (≤ setting) · low stock · open events awaiting reconciliation.
2. **Manager Dashboard:** total SKUs · total units on hand · low/out-of-stock lists · near-expiry & expired lists · open events + discrepancies · this week's movements (received/sold/written-off) · recent activity feed.
3. **Reports (export Excel/CSV, on-demand):** Current Stock (SKU & batch) · Movement History (audit) · Expiry · Event Reconciliation · Write-off & Damage · Adjustments · Inbound/Outbound summary.

**Optional analytics included in v1:** Sales velocity & days-of-stock · Top & slow movers · Event vs online performance.
**Excluded v1:** inventory valuation (costing deferred). Waste-rate metric = easy future add (hook reserved).
**Report delivery:** on-demand export only (no scheduled summaries in v1).

## Notes
- Staff get **view-only** access to Current Stock, Expiry Monitor, and Transaction History (self-check, no edits).
- Every action screen writes exactly one kind of transaction — mirrors the workflow map.
- Login method (email+password vs Google) decided with tech stack.
