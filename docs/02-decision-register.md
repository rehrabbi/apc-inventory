# Decision Register

Status: ✅ Approved · ⏳ Proposed / TBD · 🔁 Revisit

| # | Decision | Options considered | Chosen | Reason | Status |
|---|----------|--------------------|--------|--------|--------|
| DR-001 | Platform type | A: literal Excel · B: Google Sheets + export · C: Web app + DB | **C: Web app + database** | Needs web access, real login, multi-user, roles, audit — Excel can't do these live | ✅ |
| DR-002 | Role of Excel | Live system vs export-only | **Export/reporting/backup only** | Live guarantees require a database | ✅ |
| DR-003 | Catalog size | — | **<100 SKUs** (headroom to a few hundred) | User's operation | ✅ |
| DR-004 | Movement volume | — | **300–1,500 / week** | User's operation | ✅ |
| DR-006 | Hosting budget | Free · small · moderate · unlimited | **Free / near-free** (hard constraint) | Small business; feasible at this scale | ✅ |
| DR-007 | Users & roles | 1–2 · 3–6 · 7–15 · 15+ | **3–6, mixed roles** (staff + manager/admin) | Team size | ✅ |
| DR-008 | Locations | 1 · 2–3 · several · 1+event | **Single + "on event" temporary stock** | One warehouse; events move stock out | ✅ |
| DR-009 | Delivery approach | ASAP · few weeks · do-it-right | **Staged, quality-first** | Wants it done properly | ✅ |
| DR-010 | Sales channels | Shopify · WooCommerce · marketplaces · Amazon/etc | **WooCommerce (in dev) + Shopee/Lazada/TikTok** | Actual channels | ✅ |
| DR-011 | Sales entry (v1) | CSV import · manual · daily summary · API | **Manual entry via form**; import & API later | Simplest reliable start; model unchanged | ✅ |
| DR-012 | Expiration | all expire · mixed · no batches · none | **All/most expire → batch tracking + FEFO core** | Perishable catalog | ✅ |
| DR-013 | Events | frequent · monthly · rare · seasonal | **Seasonal/bursty** | Must handle spikes | ✅ |
| DR-014 | Customer returns | common(v1) · occasional · rare | **In v1** — restock sellable, scrap damaged | Happens often | ✅ |
| DR-015 | Costing/valuation | none · full · cost-only · unsure | **Quantities only for v1** | Keep v1 lean | ✅ |
| DR-016 | Units of measure | each · packs · mixed · weight | **Mixed** — base unit + pack size, with conversion | Buys in packs, sells singles | ✅ |
| DR-017 | Transaction taxonomy | proposed set | **Approved** (incl. `EVENT_SALE` separate from `SALE`) | Covers all workflows + north stars | ✅ |
| DR-018 | Batch identity | supplier lot · auto · both · by-expiry | **System auto-generated** unique batch ID | Simplest, always unique | ✅ |
| DR-019 | Supplier tracking | list · free text · none | **Not tracked in v1** | Keep receiving lean; add later | ✅ |
| DR-020 | Receiving qty & dates | packs vs units; which dates | **Base units**; capture **expiry + mfg date** | Matches how staff work; mfg date wanted | ✅ |
| DR-021 | Sale batch selection | auto-FEFO · auto-no-override · manual | **Auto-FEFO, override allowed** | FEFO discipline + real-world flexibility | ✅ |
| DR-022 | Order reference on sales | required · optional · none | **Always required** | Strong duplicate guard + return lookup | ✅ |
| DR-023 | Sales entry style | single · batch · both | **Both** (quick single + multi-line grid) | Fits volume + convenience | ✅ |
| DR-024 | Customer return handling | — | **Link to order; restock original-else-newest; scrap if not sellable** | Accuracy + traceability | ✅ |
| DR-025 | Expired write-off | assisted · manual | **System-assisted** (flag + one-click) | Prevents forgotten spoilage | ✅ |
| DR-026 | Write-off reasons | list+note · free · optional | **Predefined list + optional note** | Clean reporting + accountability | ✅ |
| DR-027 | Adjustment rights | mgr-only · staff+approval · any | **Manager/admin only** | Guards pain point #4 | ✅ |
| DR-028 | Adjustment source | count · ad-hoc · both | **Physical stock count** (count-and-reconcile), ad-hoc supported | Matches practice | ✅ |
| DR-029 | Event model lean | live view vs end-tally | **Live "on-event" view** → transfer/location model (finalize Phase 7) | Wants real-time event stock | ✅ |
| DR-030 | SKU source | existing · generated · mix | **User-entered existing codes**, uniqueness enforced | Already sells online | ✅ |
| DR-031 | Categories | managed · free · none | **Managed list (lookup)** | Clean reports | ✅ |
| DR-032 | Batching scope | perishable-only · all · mostly | **Batch by default** (most expire); `is_perishable` flag supports rare non-perishables | Perishable catalog | ✅ |
| DR-033 | Product status | active/discontinued · none | **None in v1** (all active) | Keep lean | ✅ |
| DR-034 | Mfg date | required · optional | **Optional** (capture when known); on RECEIPT transaction | Not always printed | ✅ |
| DR-035 | Batch grouping | per-receipt · merge-by-expiry | **Merge by product+expiry**; mfg/received on receipt txn | Fewer batches to manage | ✅ |
| DR-036 | Effective date | allow · entry-time-only | **Allow effective date** (defaults today) + separate immutable audit time | Accurate reports incl. backdated entries | ✅ |
| DR-037 | Corrections | reversing-only · mgr-edit · void-then-reverse | **Reversing entries only** (immutable log) | Full audit trail; pain point #4 | ✅ |
| DR-038 | User roles | 2 · 3 · +viewer | **Two: Staff + Manager/Admin** | Small team; simplest effective split | ✅ |
| DR-039 | Navigation | sidebar · top · hub | **Left sidebar, grouped** | Many sections, one click away | ✅ |
| DR-040 | Landing screen | action hub · dashboard · role-based | **Action Hub + alerts** (all users); Dashboard separate | Task-focused for daily use | ✅ |
| DR-041 | Write-off screens | combined · separate | **One screen, type picker** | Less clutter, consistent | ✅ |
| DR-042 | Staff visibility | view-only · none | **Staff view-only** on Current Stock, Expiry Monitor, History | Self-check without edit rights | ✅ |
| DR-043 | Reservations | none · events · +orders | **None in v1** (on-hand = available) | Matches manual flow; simplest | ✅ |
| DR-044 | Balance calc | live · running-total · live-then-cache | **Compute live from transactions** | Exact, no drift; fine at scale | ✅ |
| DR-045 | Negative stock | hard-block-all · mgr-override · block+adjust | **Hard block for everyone** | Strongest integrity | ✅ |
| DR-046 | Multi-batch sales | auto-split · prompt · block | **Auto-split across batches (FEFO)** | Seamless + accurate | ✅ |
| DR-047 | Expired + sale | skip · warn-override · block | **Skip expired, never auto-sell** (flag for write-off) | Protects customers | ✅ |
| DR-048 | Near-expiry threshold | global · per-category · per-product | **Global default 30 days** (editable setting) | Simple, tunable | ✅ |
| DR-049 | Event release batches | auto-FEFO · manual | **Auto-FEFO (override allowed)** | Moves oldest stock; consistent | ✅ |
| DR-050 | Event entry mode | both · live · totals | **Both live + end-of-event totals** | Flexible for offline events | ✅ |
| DR-051 | Event close w/ discrepancy | resolve-first · close+flag · auto-loss | **Must resolve to 0 before close** (mgr adjustment) | Full accountability | ✅ |
| DR-052 | Visual direction | A Controlled Signal · B Brand-Forward · C Warm Minimal | **A — Controlled Signal** (charcoal-led, red as controlled accent) | Solves red-vs-alert; calm, readable for all-day use | ✅ |
| DR-053 | Typeface | Figtree · Inter · System | **Figtree** (warm humanist) | Warm & approachable + clean data numerals | ✅ |
| DR-054 | Brand palette | from logos | Red #D81F26 · Warm black #171210 · Cream #F3EAE6 + green/amber/red semantics | Matches APC + AI Opex identity | ✅ |
| DR-055 | Optional analytics | velocity · movers · waste · event-vs-online | **Velocity+days-of-stock · Top/slow movers · Event-vs-online** | High value, low overhead; reuse existing data | ✅ |
| DR-056 | Report delivery | on-demand · +weekly · +monthly | **On-demand export only (v1)** | Simplest; no scheduling needed yet | ✅ |
| DR-005 | Tech stack | A Supabase+React · B low-code+PG · C Firebase | **A: Supabase (Postgres+Auth+RLS) + React on free hosting** | Relational integrity enforceable; full design control; free-tier | ✅ |
| DR-057 | Login method | email/pw · Google · both | **Google sign-in** + **app-level allowlist & roles** (manager invites emails; only allowlisted users get in) | Passwordless + secure authorization | ✅ |

| DR-058 | Audit scope | admin-changes · txn-only · full | **Log key admin/master-data changes** (Change Log) + transaction log | Fuller accountability, modest effort | ✅ |
| DR-059 | Backups | daily · weekly · manual | **Automated weekly export (CSV/SQL) to Google Drive** | Safety net beyond free-tier | ✅ |

_Last updated: 2026-08-11 (Phases 14–16 closed)._
