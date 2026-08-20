# Requirements Register

Status legend: ✅ locked · 🔜 later phase · 💡 design-ahead (build hooks now, feature later)

## Core (v1)
| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Web-accessible from anywhere; works on Windows, Mac, and browser | ✅ |
| R2 | User login with role-based permissions (staff vs manager/admin) | ✅ |
| R3 | Transaction-based core: immutable movement log; balances always **calculated**, never overwritten | ✅ |
| R4 | Batch/lot + expiration tracking; FEFO deduction is core | ✅ |
| R5 | Event stock release + reconciliation with accountability | ✅ |
| R6 | Excel/CSV export for records, reporting, backup | ✅ |
| R7 | Enforced data integrity (no negative stock, no duplicate transactions, required batch when applicable) | ✅ |
| R8 | Full audit trail stamped with verified user identity | ✅ |
| R12 | Manual sales-entry form (v1) | ✅ |
| R13 | Customer-return workflow (restock sellable vs scrap damaged) | ✅ |
| R14 | Unit-of-measure model with pack↔unit conversion (mixed units) | ✅ |
| R10 | FEFO batch deduction on sale (exact mechanism decided in Phase 6) | ✅ |
| R11 | Handle seasonal/bursty event spikes gracefully | ✅ |

## Later phases
| ID | Requirement | Priority |
|----|-------------|----------|
| R9 | Multi-platform sales CSV/Excel importer (Shopee/Lazada/TikTok/WooCommerce) | 🔜 |
| R9b | API automation for sales sync — WooCommerce first, marketplaces after | 🔜 |
| R15 | Low-stock / reorder-point alerts | 🔜 |
| R16 | Barcode scanning (store barcode field now, scanning later) | 💡 |
| R17 | Costing & inventory valuation | 🔜 |

## Constraints
- **C1** Free/near-free hosting (hard constraint)
- **C2** Single physical location + "on event" temporary stock
- **C3** Scale: <100 SKUs, 300–1,500 movements/week
- **C4** Quality over speed; staged delivery
- **C5** Tech stack (framework/DB/host) not yet chosen — decide before locking

_Last updated: 2026-08-11._
