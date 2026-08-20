# Systematic Inventory Tracker — Project Documentation

A transaction-based inventory & logging system for an e-commerce company.
**Platform:** web application + database, with Excel/CSV as an export/backup format (not the live system).

## The four north stars
Every design decision must serve at least one:
1. 🎯 Trustworthy, real-time stock levels
2. ⏳ Expiry visibility & waste prevention
3. 📦 Event accountability & reconciliation
4. 🔍 Error prevention + full audit trail

## Living documents (kept up to date as we decide)
| File | Purpose |
|------|---------|
| [01-requirements-register.md](01-requirements-register.md) | What the system MUST support |
| [02-decision-register.md](02-decision-register.md) | Approved decisions, options considered, reasons |
| [03-data-model.md](03-data-model.md) | Tables, fields, relationships, IDs, rules |
| [04-workflow-map.md](04-workflow-map.md) | How inventory moves through each business process |
| [05-app-blueprint.md](05-app-blueprint.md) | Every screen/module and its responsibility |
| [06-uiux-spec.md](06-uiux-spec.md) | Navigation, screens, forms, interactions, visual design |
| [07-business-rules.md](07-business-rules.md) | Inventory calc, validation, expiry, reconciliation logic |
| [08-test-cases.md](08-test-cases.md) | Scenarios the finished system must pass |
| [10-system-blueprint.md](10-system-blueprint.md) | **Consolidated final blueprint (approval gate)** |
| [19-user-guide-sop.md](19-user-guide-sop.md) | **Employee user guide & SOP** |
| [design/](design/) | Visual mockups: design directions, type comparison |

## Development phases
1. ✅ Requirements discovery · 2. ◀ **Workflow mapping (current)** · 3. Data architecture · 4. App/module architecture · 5. Inventory calculation logic · 6. Expiration & batch tracking · 7. Event workflow · 8. E-commerce sales · 9. Other stock movements · 10. Roles & controls · 11. UI/UX architecture · 12. Visual design · 13. Dashboard & reporting · 14. Automation · 15. Validation · 16. Audit trail · 17. Testing · 18. Implementation · 19. Documentation & SOP

## Ground rules
- Transaction-based: balances are **calculated** from an immutable movement log, never overwritten.
- Collaborative: every major decision is presented with options and approved before locking.
- Free/near-free hosting is a hard constraint. Tech stack is not yet chosen.

_Last updated: 2026-08-11 (end of Phase 1)._
