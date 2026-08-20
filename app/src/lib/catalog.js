// Single source of truth for how the catalog is organized by category, shared by the
// product pickers (ProductSelect) and the Products / Stock tables so grouping is consistent.
// Product categories come first in this order; Supplies (packaging, wrappers, etc.) always last.
export const CATEGORY_ORDER = ['Supplements', 'Beverage', 'Food', 'Skincare', 'Other']

export const catRank = (c) =>
  c === 'Supplies' ? 99 : (CATEGORY_ORDER.indexOf(c) === -1 ? 50 : CATEGORY_ORDER.indexOf(c))

export const productCategory = (p) => p?.categories?.name || 'Other'

// Distinct category names present in a product list, in display order.
export function categoriesOf(products) {
  const set = new Set(products.map(productCategory))
  return [...set].sort((a, b) => catRank(a) - catRank(b) || a.localeCompare(b))
}

// Group products into [{ cat, items }] in display order; item order within a group is preserved.
export function groupByCategory(products) {
  const gs = []
  for (const p of products) {
    const cat = productCategory(p)
    let g = gs.find((x) => x.cat === cat)
    if (!g) { g = { cat, items: [] }; gs.push(g) }
    g.items.push(p)
  }
  gs.sort((a, b) => catRank(a.cat) - catRank(b.cat) || a.cat.localeCompare(b.cat))
  return gs
}
