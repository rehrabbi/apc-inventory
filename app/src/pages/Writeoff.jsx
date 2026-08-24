import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, productStockMap, batchesForProduct, writeOff, recentWriteoffs } from '../lib/api'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import ProductSelect from '../components/ProductSelect'
import { useToast } from '../components/Toast'

const today = () => new Date().toISOString().slice(0, 10)
const TYPES = [
  { v: 'DAMAGE', l: 'Damage / loss' },
  { v: 'EXPIRED', l: 'Expired' },
  { v: 'CONSUMPTION', l: 'Internal use' },
  { v: 'SAMPLE', l: 'Sample / giveaway' },
]

export default function Writeoff() {
  const [products, setProducts] = useState([])
  const [stock, setStock] = useState({})
  const [batches, setBatches] = useState([])
  const [recent, setRecent] = useState([])
  const [productId, setProductId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [type, setType] = useState('DAMAGE')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [eff, setEff] = useState(today())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const toast = useToast()

  async function loadRecent() { try { setRecent(await recentWriteoffs()) } catch (e) { setMsg({ type: 'err', text: e.message }) } }
  useEffect(() => {
    listProducts().then(setProducts).catch(e => setMsg({ type: 'err', text: e.message }))
    productStockMap().then(setStock).catch(() => {})
    loadRecent()
  }, [])
  useEffect(() => {
    setBatchId('')
    if (!productId) { setBatches([]); return }
    batchesForProduct(productId).then(setBatches).catch(e => setMsg({ type: 'err', text: e.message }))
  }, [productId])

  async function submit(e) {
    e.preventDefault()
    if (!productId || !batchId) return setMsg({ type: 'err', text: 'Pick a product and batch.' })
    if (!(Number(qty) > 0)) return setMsg({ type: 'err', text: 'Quantity must be greater than 0.' })
    setSaving(true); setMsg(null)
    try {
      await writeOff({ product: productId, batch: batchId, type, qty: Number(qty), note: note.trim() || null, effective: eff })
      const label = TYPES.find(t => t.v === type)?.l
      toast.success(`Wrote off ${qty} unit(s): ${label}.`)
      setQty(''); setNote('')
      setBatches(await batchesForProduct(productId)); productStockMap().then(setStock).catch(() => {}); loadRecent()
    } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-head"><h1>Write-off</h1><div className="sub">Remove stock for damage, expiry, internal use, or samples.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      {products.length === 0 ? (
        <div className="card"><EmptyState icon="package" title="No products yet">A manager needs to <Link to="/products">add products</Link> first.</EmptyState></div>
      ) : (
        <form className="card mb-block" onSubmit={submit}>
          <div className="card-b">
            <div className="form-grid">
              <div className="field full"><label htmlFor="wo-product">Product *</label>
                <ProductSelect id="wo-product" products={products.filter(p => Number(stock[p.id] ?? 0) > 0)} value={productId}
                  onChange={setProductId} onCreated={(row) => setProducts(ps => [...ps, row])} />
              </div>
              <div className="field full"><label htmlFor="wo-batch">Batch *</label>
                <select id="wo-batch" className="select" value={batchId} onChange={e => setBatchId(e.target.value)} disabled={!productId}>
                  <option value="">{productId ? (batches.length ? 'Select a batch…' : 'No stock on hand') : 'Pick a product first'}</option>
                  {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.code}{b.lot_code ? ` · ${b.lot_code}` : ''} · {b.expiry_date ? `exp ${b.expiry_date}` : 'no expiry'} · {Number(b.on_hand)} on hand</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="wo-type">Reason / type *</label>
                <select id="wo-type" className="select" value={type} onChange={e => setType(e.target.value)}>
                  {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="wo-qty">Quantity *</label>
                <input id="wo-qty" className="input" type="number" min="0" step="any" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
              </div>
              <div className="field"><label htmlFor="wo-eff">Written off on</label>
                <input id="wo-eff" className="input" type="date" value={eff} onChange={e => setEff(e.target.value)} />
              </div>
              <div className="field full"><label htmlFor="wo-note">Note</label>
                <input id="wo-note" className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="optional" />
              </div>
              <div className="field full" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <button className="btn btn-danger" disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Recording…</> : 'Write off stock'}</button>
              </div>
            </div>
          </div>
        </form>
      )}

      <h2 className="section-title">Recent write-offs</h2>
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Date</th><th>Type</th><th>SKU</th><th>Product</th><th>Batch</th><th className="right">Qty</th></tr></thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td className="num">{r.effective_date}</td>
                  <td>{TYPES.find(t => t.v === r.type)?.l ?? r.type}</td>
                  <td className="num">{r.products?.sku}</td>
                  <td>{r.products?.name}</td>
                  <td className="num muted">{r.batches?.code}</td>
                  <td className="num right">{Number(r.qty)}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan="6"><div className="empty">No write-offs yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
