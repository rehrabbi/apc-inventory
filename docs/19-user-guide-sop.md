# APC Inventory — User Guide & Standard Operating Procedures

A simple guide for everyone who uses the system. No technical knowledge needed.

---

## 1. What this system does

It keeps an accurate, always-up-to-date count of your stock by recording **every movement** — deliveries in, sales out, returns, write-offs, and event stock. You never type in a "new total"; you record what *happened*, and the system calculates the totals for you. That means the numbers are always trustworthy and every change is traceable to a person.

## 2. Getting in

- Open the app link and click **Continue with Google**.
- You can only get in if a manager has added your Google email. If you see "No access yet", ask a manager to add you (Users screen).
- **Two roles:**
  - **Staff** — do daily work (receive, sell, returns, write-offs, events) and *view* stock and history.
  - **Manager/Admin** — everything staff can do, plus adjustments, closing events, products, settings, users, reports, and backups.

## 3. The screen layout

The menu on the left is grouped: **Home** (Action Hub, Dashboard), **Operations** (the daily tasks), **Events**, **Inventory** (stock views, reports), and **Management** (manager-only). The **Action Hub** is your home base — big task buttons plus alerts for anything that needs attention.

---

## 4. Everyday tasks (step by step)

### 📥 Receive stock (a delivery arrives)
1. **Receive Stock** → pick the product.
2. Enter the **quantity** (in single units).
3. For products that expire, enter the **expiry date** (required) and optionally the manufacturing date.
4. **Receive stock.** The system creates/updates the batch automatically.

### 🛒 Record a sale (an online order)
1. **Record Sale** → type the **order reference** (e.g. the Shopee/Lazada order number).
2. Add a line: pick the product and quantity. Add more lines for more products in the same order.
3. **Record sale.** The system automatically takes stock from the **earliest-expiring batch first**, splitting across batches if needed. It will refuse the sale if there isn't enough non-expired stock.
> The same order number can't be recorded twice for the same product — this prevents double-counting.

### ↩️ Customer return
1. **Returns** → enter the **original order reference** and product + quantity.
2. Tick **"resellable"** if the item can go back on the shelf (it returns to stock). Leave it unticked if it's damaged (recorded as scrapped, not restocked).
3. **Record.** You can't return more than was sold on that order.

### 🗑️ Write-off (damage, expiry, internal use, samples)
1. **Write-off** → pick the product, then the specific **batch**, then the **reason/type**.
2. Enter quantity + optional note → **Write off stock.**

### ⏳ Expiry Monitor
- Shows batches **near expiry** (sell these first!) and **expired** (must be written off).
- For expired stock, click **Write off** → confirm. It's removed in one step.

---

## 5. Events

### Running an event
1. **Events** → **New event** (name, venue, dates) → **Create & open.**
2. **Release to event** — pick product + quantity. Stock leaves the warehouse into the event "pool" (earliest-expiry first).
3. **During the event**, use **Record at event** to log **Sales**, **Samples**, and **Damage** as they happen (or all at the end).
4. **Return to warehouse** — record what physically comes back.

### Closing an event (manager)
- The **Reconciliation** table shows, per product: Released, Sold, Samples, Damage, Returned, and **Remaining**.
- **Remaining must be 0** for every product before you can close. If something's left, record more returns or a damage/loss until it's accounted for.
- Click **Close event** → confirm. A closed event is read-only.

---

## 6. Manager tasks

- **Adjustments / Stock Count** — after a physical count, pick the product + batch, enter the **actual counted quantity**; the system records the difference with a **reason**. (Corrections are never silent.)
- **Products** — add/edit SKUs (code, category, unit, whether it expires, reorder point).
- **Settings** — the near-expiry warning window (default 30 days), and the lists of categories, units, and reasons.
- **Users** — add someone by Google email + role, disable people who leave, change roles. (You can't change your own role or disable yourself.)
- **Reports & Export** — download **CSV** files (open in Excel) for stock, transactions, expiring, and products.
- **Backup** — a full snapshot runs **automatically every week**. You can also **Download full backup (JSON)** anytime and save it to Google Drive.
- **History** & **Change Log** — the full, unchangeable record of stock movements and admin changes.

---

## 7. Suggested routines

- **Daily:** record sales, receive deliveries, log any damage/returns. Glance at the Action Hub alerts.
- **Weekly:** check the **Expiry Monitor**; review the **Dashboard** (low stock, days-of-stock, movers); download a backup to Drive.
- **Per event:** release → record movements → return → reconcile to zero → manager closes.
- **Periodically:** do a physical **stock count** and reconcile via Adjustments.

## 8. Good things to know

- **You can't make stock go negative** — the system blocks it. If reality differs, a manager records an Adjustment.
- **Nothing is ever secretly edited or deleted.** A mistake is corrected with a new entry, and both are visible in History.
- **Oldest stock sells first** (FEFO) automatically, and **expired stock is never sold** — it's flagged for write-off.

## 9. Troubleshooting

| Problem | What to do |
|---|---|
| "No access yet" after login | Ask a manager to add your Google email in **Users**. |
| "Not enough sellable stock" | The non-expired stock is lower than the sale. Check Current Stock; receive more or adjust. |
| Can't close an event | Something is still unaccounted — make the **Remaining** column all zeros first. |
| A number looks wrong | Open **History**, filter by the product, and read the movements. Don't overwrite — record a correction (manager Adjustment). |
| Forgot to record something last week | Use the **date field** on the form to set when it actually happened. |

---

_Questions or changes? The full design and decisions live in the `docs/` folder. Keep this guide handy near the workstation._
