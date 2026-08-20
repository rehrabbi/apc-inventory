# UI/UX Specification & Design System ✅ (Phase 11–12, locked 2026-08-11)

## Principles (locked)
- Employees must instantly answer: "Where do I click? What do I enter? What happened? What's my stock? What needs attention?"
- Forms over raw grids for entry; calculated values read-only.
- **Red discipline:** brand red = identity + key actions only. Routine status uses green/amber; red on *data* always means "needs attention."
- Accessibility & readability over decoration (WCAG AA).

## Visual direction
**Direction A — "Controlled Signal":** warm charcoal-led UI, cream surfaces, APC red as a controlled accent. Light-first, dark mode supported. **Typeface: Figtree** (warm humanist), system fallback.

---

## Design tokens — LIGHT (default)
```
/* Brand */            --brand:#D81F26  --brand-strong:#B71C22  --brand-tint:#F4E7E7
/* Neutrals (warm) */  --canvas:#F1EBE5  --surface:#FFFFFF  --surface-2:#F8F4F0
                       --ink:#211C19  --ink-2:#5C534C  --muted:#7A6F66  --line:#E7DED6
/* Primary action */   --primary:#211C19  --primary-ink:#FDF6F1  --primary-hover:#332B26
/* Semantic */         --ok:#1E7A48 / bg #E4F1E9 / ink #14532D      (In Stock / success)
                       --warn:#9A6700 / bg #FBEFCF / ink #6B4700    (Low Stock)
                       --soon:#B45309 / bg #FBEAD3 / ink #7C3B06    (Near-Expiry)
                       --crit:#C1121F / bg #FBE3E3 / ink #7A0C14    (Expired / error)
                       --info:#3B5567 / bg #E5EDF1
/* Focus */            --focus:#D81F26 (2px ring, 2px offset)
```

## Design tokens — DARK
```
--canvas:#1A1614  --surface:#221C19  --surface-2:#2A231F
--ink:#F1E9E3  --ink-2:#C9BEB5  --muted:#A79C93  --line:#362D28
--brand:#E5484D  --brand-tint:#3A211F
--primary:#EDE4DC  --primary-ink:#1A1614  --primary-hover:#DED2C8   (light button on dark)
--ok:#46B67C / bg #14311F / ink #B6ECCB     --warn:#D6A036 / bg #34280E / ink #F3D89A
--soon:#DE8A3E / bg #35220F / ink #F3C99B   --crit:#E5484D / bg #3A1A1B / ink #F4B8BA
```
Theme switching: tokens on `:root`; overridden under `@media (prefers-color-scheme:dark)` and `:root[data-theme=...]`.

## Typography — Figtree
- Scale (base 16px): Display 30/700 · H1 24/700 · H2 20/700 · H3 16/600 · Body 14/400 · Small 12.5 · Label 11 uppercase +.05em.
- Line-height: headings 1.2, body 1.5. Weights: 400 body, 500 emphasis, 600 labels/buttons, 700 headings/numbers, 800 display.
- **Data numerals use `tabular-nums`** for aligned columns.

## Spacing & shape
- Spacing scale (4px base): 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64.
- Radius: sm 8 · **default 12** · lg 16 · pill 999. Layout via flex/grid + `gap`.
- Elevation: `--shadow-sm` (rest cards) and a soft warm `--shadow` for raised/hover.

## Components
- **Buttons:** *Primary* charcoal/cream · *Secondary* outline (line border) · *Danger* red text + red-tint border (always with confirm dialog) · optional *Brand* (red fill) reserved for a single hero CTA. Sizes sm/md/lg. Visible red focus ring.
- **Inputs:** surface bg, 1px line, radius 12, label above (12.5/600); focus = brand border + soft ring; error = crit border + helper text; disabled = surface-2/muted.
- **Status badges:** pill + dot — In Stock (ok) · Low (warn) · Near-Expiry (soon) · Expired (crit) · Info.
- **Tables:** uppercase muted header, sticky on long lists; 12.5–13px rows; numeric cols tabular + right-aligned; row hover surface-2; comfortable density (compact toggle later).
- **Cards/Panels:** surface + line + radius 12/16, optional bordered header.
- **Alerts/Banners:** soft severity bg + tinted border + icon/dot.
- **Sidebar nav:** items 13px; active = brand-tint bg + brand ink + accent underline; group labels tiny uppercase.
- **Confirmation dialogs:** centered modal for every irreversible action (write-off, event close, reversing entry) — title + plain-language consequence + [Cancel][Confirm].
- **Icons:** single line-icon set (e.g., Lucide), ~1.5px stroke, 18–20px.
- **Motion:** subtle 150–200ms transitions on hover/focus only; respect `prefers-reduced-motion`.

## Accessibility
- WCAG AA contrast (use `--*-ink` tokens for small colored text). Always-visible keyboard focus. Touch targets ≥40px. Status never conveyed by color alone — always icon/dot + label.

_Reference mockups: docs/design/01-design-directions.html · 02-type-comparison.html._
