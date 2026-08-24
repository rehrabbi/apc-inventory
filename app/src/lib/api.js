import { supabase } from './supabase'

// ---- Lookups ----
export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data
}
export async function listUnits() {
  const { data, error } = await supabase.from('units').select('*').order('name')
  if (error) throw error
  return data
}
export async function listReasons(kind) {
  let q = supabase.from('reasons').select('*').eq('is_active', true).order('label')
  if (kind) q = q.eq('kind', kind)
  const { data, error } = await q
  if (error) throw error
  return data
}

// ---- Products ----
// Shared product ordering: a natural, numeric-aware name sort that keeps each family
// together and reads cleanly (1 box, 20/30/40/50 tablets, then wholesale); bundles last.
export function sortProducts(list) {
  const isBundle = (p) => /bundle/i.test(p.name || '')
  return [...list].sort((a, b) =>
    (isBundle(a) - isBundle(b)) ||
    (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }))
}
export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id,sku,name,is_perishable,pack_size,retail_price,barcode,reorder_point,notes,category_id,unit_id,categories(name),units(name)')
    .order('name')
  if (error) throw error
  return sortProducts(data)
}
export async function productStockMap() {
  const { data, error } = await supabase.from('v_product_stock').select('*')
  if (error) throw error
  const m = {}
  for (const r of data) m[r.product_id] = Number(r.on_hand)
  return m
}
export async function createProduct(p) {
  const { data, error } = await supabase.from('products').insert(p).select().single()
  if (error) throw error
  return data
}
export async function updateProduct(id, p) {
  const { error } = await supabase.from('products').update(p).eq('id', id)
  if (error) throw error
}

// ---- Receiving ----
export async function receiveStock({ product, qty, expiry, mfg, effective, lot }) {
  const { error } = await supabase.rpc('receive_stock', {
    p_product: product,
    p_qty: qty,
    p_expiry: expiry ?? null,
    p_mfg: mfg ?? null,
    p_effective: effective,
    p_lot: lot ?? null,
  })
  if (error) throw error
}
// ---- Stock / batches ----
export async function batchStatus() {
  const { data, error } = await supabase.from('v_batch_status').select('*')
  if (error) throw error
  return data
}

// ---- Sales ----
export async function recordSale({ product, qty, order_ref, effective }) {
  const { error } = await supabase.rpc('record_sale', {
    p_product: product, p_qty: qty, p_order_ref: order_ref, p_effective: effective,
  })
  if (error) throw error
}
export async function recentSales() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id,qty,effective_date,order_ref,products(sku,name),batches(code,expiry_date)')
    .eq('type', 'SALE')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

// ---- Batches for a product (with live on-hand) ----
export async function batchesForProduct(productId) {
  const { data, error } = await supabase
    .from('v_batch_status').select('*').eq('product_id', productId)
  if (error) throw error
  return data.filter(b => Number(b.on_hand) > 0)
    .sort((a, b) => (a.expiry_date ?? '9999').localeCompare(b.expiry_date ?? '9999'))
}

// ---- Write-offs ----
export async function writeOff({ product, batch, type, qty, note, effective }) {
  const { error } = await supabase.rpc('write_off', {
    p_product: product, p_batch: batch, p_type: type, p_qty: qty, p_note: note ?? null, p_effective: effective,
  })
  if (error) throw error
}
export async function recentWriteoffs() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id,type,qty,effective_date,note,products(sku,name),batches(code,expiry_date)')
    .in('type', ['DAMAGE', 'EXPIRED', 'CONSUMPTION', 'SAMPLE'])
    .order('created_at', { ascending: false }).limit(15)
  if (error) throw error
  return data
}

// ---- Customer returns ----
export async function customerReturn({ orderRef, product, qty, sellable, note, effective }) {
  const { error } = await supabase.rpc('customer_return', {
    p_order_ref: orderRef, p_product: product, p_qty: qty, p_sellable: sellable, p_note: note ?? null, p_effective: effective,
  })
  if (error) throw error
}
export async function recentReturns() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id,type,qty,effective_date,order_ref,products(sku,name)')
    .in('type', ['CUSTOMER_RETURN', 'SCRAP_RETURN'])
    .order('created_at', { ascending: false }).limit(15)
  if (error) throw error
  return data
}

// ---- Expiry monitor ----
export async function expiringBatches() {
  const [batches, products] = await Promise.all([batchStatus(), listProducts()])
  const pmap = {}
  for (const p of products) pmap[p.id] = p
  return batches
    .filter(b => Number(b.on_hand) > 0 && (b.expiry_state === 'near' || b.expiry_state === 'expired'))
    .map(b => ({ ...b, product: pmap[b.product_id] }))
    .sort((a, b) => (a.expiry_date ?? '').localeCompare(b.expiry_date ?? ''))
}

// ---- Adjustments ----
export async function adjustStock({ product, batch, actual, reason, note, effective }) {
  const { error } = await supabase.rpc('adjust_stock', {
    p_product: product, p_batch: batch, p_actual: actual, p_reason: reason ?? null, p_note: note ?? null, p_effective: effective,
  })
  if (error) throw error
}

// ---- Transaction history ----
export async function transactionHistory() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id,type,qty,effective_date,order_ref,note,products(sku,name),batches(code),profiles(full_name),reasons(label)')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) throw error
  return data
}

// ---- Change log ----
export async function changeLog() {
  const { data, error } = await supabase
    .from('change_log')
    .select('id,at,entity,record_ref,action,profiles(full_name)')
    .order('at', { ascending: false }).limit(200)
  if (error) throw error
  return data
}

// ---- Users ----
export async function listUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data
}
export async function addUser({ email, full_name, role }) {
  const { error } = await supabase.from('profiles').insert({ email, full_name, role })
  if (error) throw error
}
export async function updateUser(id, patch) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) throw error
}

// ---- Settings & lookups ----
export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*')
  if (error) throw error
  const m = {}; for (const r of data) m[r.key] = r.value
  return m
}
export async function setSetting(key, value) {
  const { error } = await supabase.from('settings').update({ value: String(value) }).eq('key', key)
  if (error) throw error
}
export async function addLookup(table, row) {
  const { error } = await supabase.from(table).insert(row)
  if (error) throw error
}

// ---- Owner-only danger zone ----
export async function isOwner() {
  const { data, error } = await supabase.rpc('is_owner')
  if (error) throw error
  return !!data
}
export async function resetActivity() {
  const { error } = await supabase.rpc('admin_reset_activity')
  if (error) throw error
}
export async function deleteEvent(id) {
  const { error } = await supabase.rpc('admin_delete_event', { p_event: id })
  if (error) throw error
}

// ---- Events ----
export async function listEvents() {
  const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function createEvent(row) {
  const { data, error } = await supabase.from('events').insert({ ...row, status: 'active' }).select().single()
  if (error) throw error
  return data
}
export async function getEvent(id) {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
export async function eventReconcile(eventId) {
  const [rows, products] = await Promise.all([
    supabase.from('v_event_reconcile').select('*').eq('event_id', eventId),
    listProducts(),
  ])
  if (rows.error) throw rows.error
  const pmap = {}; for (const p of products) pmap[p.id] = p
  return rows.data.map(r => ({ ...r, product: pmap[r.product_id] }))
}
export async function eventRelease({ event, product, qty, effective }) {
  const { error } = await supabase.rpc('event_release', { p_event: event, p_product: product, p_qty: qty, p_effective: effective })
  if (error) throw error
}
export async function eventConsume({ event, product, qty, type, effective }) {
  const { error } = await supabase.rpc('event_consume', { p_event: event, p_product: product, p_qty: qty, p_type: type, p_effective: effective })
  if (error) throw error
}
export async function eventReturnStock({ event, product, qty, effective }) {
  const { error } = await supabase.rpc('event_return', { p_event: event, p_product: product, p_qty: qty, p_effective: effective })
  if (error) throw error
}
export async function closeEvent(event) {
  const { error } = await supabase.rpc('close_event', { p_event: event })
  if (error) throw error
}

// ---- Dashboard analytics ----
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

export async function dashboardData() {
  const ov = await overview()
  const [sales, chan, evs, recent] = await Promise.all([
    supabase.from('v_sales_30d').select('*'),
    supabase.from('transactions').select('type,qty').in('type', ['SALE', 'EVENT_SALE']).gte('effective_date', daysAgo(30)),
    supabase.from('events').select('id').eq('status', 'active'),
    transactionHistory(),
  ])
  if (sales.error) throw sales.error
  const sold = {}; for (const r of sales.data) sold[r.product_id] = Number(r.sold_30d)
  const unitsOnHand = Object.values(ov.stock).reduce((s, v) => s + Number(v), 0)

  const rows = ov.products.map(p => {
    const s30 = sold[p.id] ?? 0
    const oh = ov.stock[p.id] ?? 0
    const velocity = s30 / 30
    const days = velocity > 0 ? Math.round(oh / velocity) : null
    return { sku: p.sku, name: p.name, onHand: oh, sold30: s30, velocity: +velocity.toFixed(2), days }
  })
  const movers = [...rows].sort((a, b) => b.sold30 - a.sold30)
  const online = (chan.data || []).filter(t => t.type === 'SALE').reduce((s, t) => s + Number(t.qty), 0)
  const event = (chan.data || []).filter(t => t.type === 'EVENT_SALE').reduce((s, t) => s + Number(t.qty), 0)

  return {
    ...ov, unitsOnHand, openEvents: (evs.data || []).length,
    topMovers: movers.filter(r => r.sold30 > 0).slice(0, 5),
    slowMovers: movers.filter(r => r.onHand > 0).sort((a, b) => a.sold30 - b.sold30).slice(0, 5),
    velocityRows: rows.filter(r => r.days != null).sort((a, b) => a.days - b.days).slice(0, 8),
    channel: { online, event },
    recent: recent.slice(0, 8),
  }
}

// ---- Backup ----
export async function runBackup() {
  const { error } = await supabase.rpc('make_backup')
  if (error) throw error
}
export async function fetchBackup() {
  const tables = ['products', 'batches', 'transactions', 'events', 'profiles', 'change_log', 'settings']
  const out = { taken_at: new Date().toISOString() }
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*')
    if (error) throw error
    out[t] = data
  }
  return out
}

// ---- Overview metrics (Action Hub / Dashboard) ----
export async function overview() {
  const [products, stock, batches] = await Promise.all([listProducts(), productStockMap(), batchStatus()])
  let low = 0, near = 0, expired = 0
  for (const b of batches) {
    const oh = Number(b.on_hand)
    if (oh > 0 && b.expiry_state === 'near') near++
    if (oh > 0 && b.expiry_state === 'expired') expired++
  }
  for (const p of products) {
    const oh = stock[p.id] ?? 0
    if (p.reorder_point != null && oh <= Number(p.reorder_point)) low++
  }
  return { totalSkus: products.length, low, near, expired, products, stock, batches }
}

export async function recentReceipts() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id,qty,effective_date,mfg_date,products(sku,name),batches(code,expiry_date,lot_code)')
    .eq('type', 'RECEIPT')
    .order('created_at', { ascending: false })
    .limit(15)
  if (error) throw error
  return data
}
