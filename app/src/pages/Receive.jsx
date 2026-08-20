import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, receiveStock, recentReceipts } from '../lib/api'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import ProductSelect from '../components/ProductSelect'
import { useToast } from '../components/Toast'

const today = () => new Date().toISOString().slice(0, 10)

export default function Receive() {
  const [products, setProducts] = useState([])
  const [recent, setRecent] = useState([])
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [expiry, setExpiry] = useState('')
  const [lot, setLot] = useState('')
  const [mfg, setMfg] = useState('')
  const [eff, setEff] = useState(today())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const toast = useToast()

  const product = useMemo(() => products.find(p => p.id === productId), [products, productId])

  async function loadRecent() { try { setRecent(await recentReceipts()) } catch (e) { setMsg({ type: 'err', text: e.message }) } }
  useEffect(() => { listProducts().then(setProducts).catch(e => setMsg({ type: 'err', text: e.message })); loadRecent() }, [])

  async function submit(e) {
    e.preventDefault()
    if (!productId) return setMsg({ type: 'err', text: 'Pick a product.' })
    if (!(Number(qty) > 0)) return setMsg({ type: 'err', text: 'Quantity must be greater than 0.' })
    if (product?.is_perishable && !expiry) return setMsg({ type: 'err', text: 'This product is perishable, so an expiry date is required.' })
    setSaving(true); setMsg(null)
    try {
      await receiveStock({
        product: productId, qty: Number(qty),
        expiry: product?.is_perishable ? expiry : null,
        lot: lot.trim() || null, mfg: mfg || null, effective: eff,
      })
      toast.success(`Received ${qty} × ${product.sku}.`)
      setQty(''); setExpiry(''); setLot(''); setMfg('')
      loadRecent()
    } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-head"><h1>Receive Stock</h1><div className="sub">Log a supplier delivery. Enter quantity in base units.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      {products.length === 0 ? (
        <div className="card"><EmptyState icon="package" title="No products yet">A manager needs to <Link to="/products">add products</Link> before you can receive stock.</EmptyState></div>
      ) : (
        <div className="card mb-block">
          <div className="card-b">
            <form className="form-grid" onSubmit={submit}>
              <div className="field full"><label htmlFor="rcv-product">Product *</label>
                <ProductSelect id="rcv-product" products={products} value={productId}
                  onChange={setProductId} onCreated={(row) => setProducts(ps => [...ps, row])} />
              </div>
              <div className="field"><label htmlFor="rcv-qty">Quantity (base units) *</label>
                <input id="rcv-qty" className="input" type="number" min="0" step="any" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 120" />
              </div>
              <div className="field"><label htmlFor="rcv-expiry">Expiry date {product ? (product.is_perishable ? '*' : '(n/a)') : ''}</label>
                <input id="rcv-expiry" className="input" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} disabled={!product || !product.is_perishable} />
              </div>
              <div className="field"><label htmlFor="rcv-lot">Lot / batch number</label>
                <input id="rcv-lot" className="input" value={lot} onChange={e => setLot(e.target.value)} placeholder="e.g. EAC08F26 (optional)" />
              </div>
              <div className="field"><label htmlFor="rcv-mfg">Manufacturing date</label>
                <input id="rcv-mfg" className="input" type="date" value={mfg} onChange={e => setMfg(e.target.value)} />
              </div>
              <div className="field"><label htmlFor="rcv-eff">Received on</label>
                <input id="rcv-eff" className="input" type="date" value={eff} onChange={e => setEff(e.target.value)} />
              </div>
              <div className="field full" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Recording…</> : 'Receive stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h2 className="section-title">Recent receipts</h2>
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Date</th><th>SKU</th><th>Product</th><th>Batch</th><th>Lot no.</th><th>Expiry</th><th className="right">Qty</th></tr></thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td className="num">{r.effective_date}</td>
                  <td className="num">{r.products?.sku}</td>
                  <td>{r.products?.name}</td>
                  <td className="num muted">{r.batches?.code}</td>
                  <td className="num muted">{r.batches?.lot_code ?? '·'}</td>
                  <td className="num">{r.batches?.expiry_date ?? '·'}</td>
                  <td className="num right">{Number(r.qty)}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan="7"><div className="empty">No receipts yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
