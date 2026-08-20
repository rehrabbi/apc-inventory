# APC Inventory

A transaction-based inventory and logging system for APC (products, batches, expiry, events),
built as a web app on **React 19 + Vite** with a **Supabase (PostgreSQL)** backend.

Balances are **calculated** from an immutable movement log, never overwritten. The core integrity
rules (no negative stock, immutable transactions, FEFO allocation, batch-by-expiry) are enforced by
the database itself, so the app can't corrupt stock even with a bug in the UI.

---

## Tech stack

- **Frontend:** React 19, Vite 5, React Router 7, Mantine 9 (app shell + Action Hub), plus a
  hand-written CSS design system for the remaining screens. Plain JavaScript/JSX (no TypeScript).
- **Backend:** Supabase — PostgreSQL, Row-Level Security, Google OAuth, database functions/triggers.
- **Hosting target:** free tiers (Supabase free project; the frontend builds to static files).

## Prerequisites

- **Node.js 18+** (20+ recommended) and npm.
- A **Supabase** account (free tier is enough).
- A **Google Cloud** OAuth client (for sign-in).

---

## Getting started on a new machine

```bash
git clone https://github.com/rehrabbi/apc-inventory.git
cd apc-inventory/app
npm install
```

Then create the env file and run (see the sections below for the Supabase/Google one-time setup):

```bash
# app/.env.local  (copy from app/.env.example and fill in)
cd app
npm run dev
```

Open the printed local URL (default `http://localhost:5173`) and sign in with Google.

> **Ports & OAuth:** the Google redirect URL is tied to the dev origin, so keep the dev server on
> its usual port (5173) unless you also update the allowlist in Supabase and Google.

---

## One-time backend setup

### 1. Create the database
1. Create a new Supabase project. Save the database password; pick a nearby region.
2. Open **SQL Editor**, paste the full contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**.
   This creates every table, view, function, trigger, RLS policy, FEFO logic, and the seed lookups.
3. Add the first manager (use your own Google email):
   ```sql
   insert into profiles(email, full_name, role) values ('you@example.com','Your Name','manager');
   ```
   Only emails present in `profiles` can sign in; Google just proves identity.

### 2. Enable Google sign-in
1. Supabase → **Authentication → Providers → Google** → enable.
2. Copy the redirect URL it shows into a Google OAuth client
   (Google Cloud Console → Credentials → OAuth client ID → Web application), and add your app
   origin(s) to the authorized origins/redirects.
3. Paste the Google **client ID + secret** back into Supabase and save.

### 3. Point the app at your project
1. Supabase → **Project Settings → API** → copy the **Project URL** and the **anon public** key.
2. In [`app/`](app/), copy `.env.example` to `.env.local` and fill it in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
   The anon key is safe in the browser (RLS protects the data). **Never** put the `service_role` key
   in the app. `.env.local` is gitignored — keep it out of version control.

---

## Commands

```bash
npm run dev       # start the dev server (Vite)
npm run build     # production build to app/dist
npm run preview   # preview the production build locally
```

---

## Project layout

```
app/
  index.html                 fonts, favicon, meta
  src/
    main.jsx                 mounts MantineProvider + Notifications + Toast provider
    App.jsx                  routes (lazy-loaded under Suspense)
    auth/AuthContext.jsx     Google auth + profile/role resolution
    components/              AppShell, ProductSelect, Modal, Banner, Toast, Skeleton, etc.
    lib/
      supabase.js            Supabase client (reads VITE_ env vars)
      api.js                 all data access (queries + RPC calls)
      catalog.js             shared category grouping/ordering
      export.js              CSV/Excel export helpers
    pages/                   one file per screen (Receive, Sell, Stock, Products, Events, …)
    styles/
      tokens.css             design tokens + core component CSS (hand-CSS system)
      app.css                page/layout styles
    theme.js                 Mantine theme tokens (the two Mantine screens)
supabase/
  schema.sql                 the entire database (run this on a fresh project)
docs/                        design docs & living registers (requirements, data model, rules, SOP)
```

## Architecture notes

- **Immutable ledger.** `transactions` is append-only (a trigger blocks UPDATE/DELETE). Corrections are
  reversing entries, not edits. Stock is derived by views (`v_product_stock`, `v_warehouse_stock`,
  `v_batch_status`, event views) — never stored.
- **Batches by expiry (+ lot).** A batch is keyed by `(product, expiry_date)`; receiving merges into the
  matching batch. Each batch has an auto code (`SKU-YYYYMMDD`) plus an optional manufacturer `lot_code`.
- **FEFO.** Sales/releases auto-allocate from the earliest-expiring non-expired batch, splitting across
  batches as needed. No-negative-stock is enforced in the database.
- **Roles via RLS.** `profiles` is the allowlist. `manager` can manage master data and adjust stock;
  `staff` records movements. All access is gated by RLS policies and `security definer` RPCs.
- **Server-side operations** (receiving, sales, returns, write-offs, adjustments, event flow) run as
  database functions so integrity is centralized, the frontend only calls them.

---

## Conventions & preferences

Keep these consistent when extending the app:

- **Design language:** "Modern SaaS", rounded and lightly elevated. Crimson (`#D81F26`) is a *controlled
  accent* (status icons stay semantic; primary buttons are charcoal). Tokens live in
  `app/src/styles/tokens.css`; the two Mantine screens follow `app/src/theme.js`.
- **Two design systems (mid-migration):** Mantine drives the app shell + Action Hub; the other screens
  use the hand-CSS token system. Respect whichever system a screen already uses.
- **Dark mode** is keyed to `data-mantine-color-scheme`. Do **not** reintroduce a `prefers-color-scheme`
  media query for theming.
- **Copy rules:** no em dashes (use commas, colons, periods). Use a middot (`·`) for empty values and as
  the `SKU · name` separator. Plain, human microcopy. Irreversible actions get a confirm dialog.
- **Fonts:** Public Sans + IBM Plex Mono on the Mantine screens; the Calibri stack on the hand-CSS screens.
- **Commits:** authored solely by the project owner. No external co-author or generator trailers.
- **Working style:** quality over speed ("do it right"). Free or near-free hosting is a hard constraint.
- **Database safety:** treat `supabase/schema.sql`, RLS, auth, and `app/src/lib/api.js` as load-bearing.
  Prefer additive migrations; think twice before changing existing tables, policies, or RPC signatures,
  and keep `schema.sql` in sync with the live database.

---

## Deferred / future

CSV sales import · marketplace/WooCommerce sync · reorder-point alerts · barcode scanning ·
costing & valuation · off-site (Drive) backup push · finishing the Mantine migration on the
remaining hand-CSS screens.
