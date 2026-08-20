import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { batchStatus, listProducts, transactionHistory, expiringBatches, fetchBackup, runBackup } from '../lib/api'
import { toCSV, download, stamp } from '../lib/export'
import Icon from '../components/Icon'
import Banner from '../components/Banner'
import { useToast } from '../components/Toast'

const INBOUND = ['RECEIPT', 'CUSTOMER_RETURN', 'EVENT_RETURN', 'ADJUST_IN']
const signed = (t, q) => t === 'SCRAP_RETURN' ? q : (INBOUND.includes(t) ? q : -q)

export default function Reports() {
  const { isManager } = useAuth()
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)
  const toast = useToast()

  async function run(key, fn) {
    setBusy(key); setMsg(null)
    try { await fn() } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setBusy(null) }
  }

  const currentStock = () => run('stock', async () => {
    const [batches, products] = await Promise.all([batchStatus(), listProducts()])
    const pm = {}; for (const p of products) pm[p.id] = p
    const rows = batches.map(b => ({
      sku: pm[b.product_id]?.sku, name: pm[b.product_id]?.name, batch: b.code,
      expiry: b.expiry_date ?? '', on_hand: Number(b.on_hand), status: b.expiry_state,
    })).filter(r => r.on_hand !== 0)
    if (!rows.length) return toast.info('No current stock to export yet.')
    download(`current-stock-${stamp()}.csv`, toCSV(rows))
    toast.success(`Exported ${rows.length} stock row(s) to CSV.`)
  })

  const history = () => run('history', async () => {
    const data = await transactionHistory()
    const rows = data.map(r => ({
      date: r.effective_date, type: r.type, sku: r.products?.sku, product: r.products?.name,
      batch: r.batches?.code, qty: signed(r.type, Number(r.qty)), by: r.profiles?.full_name,
      ref: r.order_ref || r.reasons?.label || r.note || '',
    }))
    if (!rows.length) return toast.info('No transactions to export yet.')
    download(`transactions-${stamp()}.csv`, toCSV(rows))
    toast.success(`Exported ${rows.length} transaction(s) to CSV.`)
  })

  const expiring = () => run('expiry', async () => {
    const data = await expiringBatches()
    const rows = data.map(b => ({ sku: b.product?.sku, product: b.product?.name, batch: b.code, expiry: b.expiry_date, on_hand: Number(b.on_hand), status: b.expiry_state }))
    if (!rows.length) return toast.info('No expiring batches to export yet.')
    download(`expiring-${stamp()}.csv`, toCSV(rows))
    toast.success(`Exported ${rows.length} batch(es) to CSV.`)
  })

  const products = () => run('products', async () => {
    const data = await listProducts()
    const rows = data.map(p => ({ sku: p.sku, name: p.name, category: p.categories?.name, unit: p.units?.name, perishable: p.is_perishable, reorder_point: p.reorder_point ?? '', barcode: p.barcode ?? '' }))
    if (!rows.length) return toast.info('No products to export yet.')
    download(`products-${stamp()}.csv`, toCSV(rows))
    toast.success(`Exported ${rows.length} product(s) to CSV.`)
  })

  const backupNow = () => run('backup', async () => { await runBackup(); toast.success('Backup snapshot saved to the database.') })
  const downloadBackup = () => run('dl', async () => {
    const data = await fetchBackup()
    download(`apc-inventory-backup-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json')
    toast.success('Full backup downloaded (JSON).')
  })

  const Btn = ({ k, onClick, children, cls = 'btn-secondary' }) => (
    <button className={`btn ${cls}`} onClick={onClick} disabled={busy === k}>{busy === k ? 'Preparing…' : children}</button>
  )

  return (
    <div>
      <div className="page-head"><h1>Reports & Backup</h1><div className="sub">Export data to CSV (opens in Excel), or save a full backup.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="card" style={{ marginBottom: 22 }}>
        <h2 className="card-h">Export (CSV)</h2>
        <div className="card-b" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn k="stock" onClick={currentStock}><Icon name="stock" size={16} />Current Stock</Btn>
          <Btn k="history" onClick={history}><Icon name="receipt" size={16} />Transaction History</Btn>
          <Btn k="expiry" onClick={expiring}><Icon name="hourglass" size={16} />Expiring Batches</Btn>
          <Btn k="products" onClick={products}><Icon name="tag" size={16} />Products</Btn>
        </div>
      </div>

      {isManager && (
        <div className="card">
          <h2 className="card-h">Backup</h2>
          <div className="card-b">
            <p className="help" style={{ marginTop: 0 }}>An automated snapshot runs weekly. You can also snapshot now, or download a full copy to save on Google Drive.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Btn k="dl" onClick={downloadBackup} cls="btn-primary"><Icon name="download" size={16} />Download full backup (JSON)</Btn>
              <Btn k="backup" onClick={backupNow}><Icon name="clock" size={16} />Snapshot to database now</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
