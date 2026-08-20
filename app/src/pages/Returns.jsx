import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, customerReturn, recentReturns } from '../lib/api'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import ProductSelect from '../components/ProductSelect'
import { useToast } from '../components/Toast'

const today = () => new Date().toISOString().slice(0, 10)

export default function Returns() {
  const [products, setProducts] = useState([])
  const [recent, setRecent] = useState([])
  const [orderRef, setOrderRef] = useState('')
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [sellable, setSellable] = useState(true)
  const [note, setNote] = useState('')
  const [eff, setEff] = useState(today())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const toast = useToast()

  async function loadRecent() { try { setRecent(await recentReturns()) } catch (e) { setMsg({ type: 'err', text: e.message }) } }
  useEffect(() => { listProducts().then(setProducts).catch(e => setMsg({ type: 'err', text: e.message })); loadRecent() }, [])

  async function submit(e) {
    e.preventDefault()
    if (!orderRef.trim()) return setMsg({ type: 'err', text: 'Order reference is required.' })
    if (!productId) return setMsg({ type: 'err', text: 'Pick a product.' })
    if (!(Number(qty) > 0)) return setMsg({ type: 'err', text: 'Quantity must be greater than 0.' })
    setSaving(true); setMsg(null)
    try {
      await customerReturn({ orderRef: orderRef.trim(), product: productId, qty: Number(qty), sellable, note: note.trim() || null, effective: eff })
      toast.success(sellable ? `Restocked ${qty} unit(s) from order ${orderRef.trim()}.` : `Recorded ${qty} scrapped unit(s) from order ${orderRef.trim()}.`)
      setQty(''); setNote(''); loadRecent()
    } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-head"><h1>Customer Returns</h1><div className="sub">Look up the order, then restock sellable items or scrap damaged ones.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      {products.length === 0 ? (
        <div className="card"><EmptyState icon="package" title="No products yet">A manager needs to <Link to="/products">add products</Link> first.</EmptyState></div>
      ) : (
        <form className="card mb-block" onSubmit={submit}>
          <div className="card-b">
            <div className="form-grid">
              <div className="field"><label htmlFor="ret-order">Original order reference *</label>
                <input id="ret-order" className="input" value={orderRef} onChange={e => setOrderRef(e.target.value)} placeholder="e.g. Shopee #12345" />
              </div>
              <div className="field"><label htmlFor="ret-product">Product *</label>
                <ProductSelect id="ret-product" products={products} value={productId} hideSupplies
                  onChange={setProductId} onCreated={(row) => setProducts(ps => [...ps, row])} />
              </div>
              <div className="field"><label htmlFor="ret-qty">Quantity *</label>
                <input id="ret-qty" className="input" type="number" min="0" step="any" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
              </div>
              <div className="field"><label htmlFor="ret-eff">Returned on</label>
                <input id="ret-eff" className="input" type="date" value={eff} onChange={e => setEff(e.target.value)} />
              </div>
              <div className="field full">
                <label className="toggle"><input type="checkbox" checked={sellable} onChange={e => setSellable(e.target.checked)} /> Item is resellable, put it back into stock</label>
                {!sellable && <span className="help">Not resellable → recorded as scrapped (written off), not returned to stock.</span>}
              </div>
              <div className="field full"><label htmlFor="ret-note">Note</label>
                <input id="ret-note" className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="optional" />
              </div>
              <div className="field full" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Recording…</> : (sellable ? 'Restock return' : 'Record scrapped return')}</button>
              </div>
            </div>
          </div>
        </form>
      )}

      <h2 className="section-title">Recent returns</h2>
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Date</th><th>Order</th><th>SKU</th><th>Product</th><th>Outcome</th><th className="right">Qty</th></tr></thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td className="num">{r.effective_date}</td>
                  <td className="muted">{r.order_ref}</td>
                  <td className="num">{r.products?.sku}</td>
                  <td>{r.products?.name}</td>
                  <td>{r.type === 'CUSTOMER_RETURN'
                    ? <span className="badge badge-ok"><span className="dot" />Restocked</span>
                    : <span className="badge badge-exp"><span className="dot" />Scrapped</span>}</td>
                  <td className="num right">{Number(r.qty)}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan="6"><div className="empty">No returns yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
