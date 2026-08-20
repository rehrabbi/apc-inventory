import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, productStockMap, recordSale, recentSales } from '../lib/api'
import Banner from '../components/Banner'
import EmptyState from '../components/EmptyState'
import ProductSelect from '../components/ProductSelect'
import { useToast } from '../components/Toast'

const today = () => new Date().toISOString().slice(0, 10)
const blankLine = () => ({ id: crypto.randomUUID(), product: '', qty: '' })

export default function Sell() {
  const [products, setProducts] = useState([])
  const [stock, setStock] = useState({})
  const [recent, setRecent] = useState([])
  const [orderRef, setOrderRef] = useState('')
  const [eff, setEff] = useState(today())
  const [lines, setLines] = useState([blankLine()])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const toast = useToast()

  async function loadRecent() { try { setRecent(await recentSales()) } catch (e) { setMsg({ type: 'err', text: e.message }) } }
  async function loadStock() { try { setStock(await productStockMap()) } catch { /* ignore */ } }
  useEffect(() => {
    listProducts().then(setProducts).catch(e => setMsg({ type: 'err', text: e.message }))
    loadStock(); loadRecent()
  }, [])

  const setLine = (i, k) => (e) => setLines(ls => ls.map((l, j) => j === i ? { ...l, [k]: e.target.value } : l))
  const setLineProduct = (i, pid) => setLines(ls => ls.map((l, j) => j === i ? { ...l, product: pid } : l))
  const addLine = () => setLines(ls => [...ls, blankLine()])
  const removeLine = (i) => setLines(ls => ls.length === 1 ? ls : ls.filter((_, j) => j !== i))

  async function submit(e) {
    e.preventDefault()
    if (!orderRef.trim()) return setMsg({ type: 'err', text: 'Order reference is required.' })
    const valid = lines.filter(l => l.product && Number(l.qty) > 0)
    if (valid.length === 0) return setMsg({ type: 'err', text: 'Add at least one line with a product and quantity.' })

    setSaving(true); setMsg(null)
    const failures = []
    const doneIds = []
    for (const l of valid) {
      try { await recordSale({ product: l.product, qty: Number(l.qty), order_ref: orderRef.trim(), effective: eff }); doneIds.push(l.id) }
      catch (err) {
        const sku = products.find(p => p.id === l.product)?.sku ?? l.product
        failures.push(`${sku}: ${err.message}`)
      }
    }
    await loadStock(); await loadRecent()
    setSaving(false)
    if (failures.length) {
      // Drop the lines that already committed so a retry does not re-submit them
      // (the server duplicate-order guard would otherwise reject them as duplicates).
      setLines(ls => { const rest = ls.filter(l => !doneIds.includes(l.id)); return rest.length ? rest : [blankLine()] })
      setMsg({ type: 'err', text: `Some lines failed: ${failures.join(' · ')}` })
    } else { toast.success(`Sale recorded for order ${orderRef.trim()} (${valid.length} line${valid.length > 1 ? 's' : ''}).`); setLines([blankLine()]); setOrderRef('') }
  }

  return (
    <div>
      <div className="page-head"><h1>Record Sale</h1><div className="sub">Auto-deducts the earliest-expiring batch first (FEFO). Add one line or many.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      {products.length === 0 ? (
        <div className="card"><EmptyState icon="package" title="No products yet">A manager needs to <Link to="/products">add products</Link> first.</EmptyState></div>
      ) : (
        <form className="card mb-block" onSubmit={submit}>
          <div className="card-b">
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="field"><label htmlFor="sell-order">Order reference *</label>
                <input id="sell-order" className="input" value={orderRef} onChange={e => setOrderRef(e.target.value)} placeholder="e.g. Shopee #12345" />
              </div>
              <div className="field"><label htmlFor="sell-eff">Sold on</label>
                <input id="sell-eff" className="input" type="date" value={eff} onChange={e => setEff(e.target.value)} />
              </div>
            </div>

            <div className="table-wrap">
              <table className="data">
                <thead><tr><th style={{ width: '55%' }}>Product</th><th>Available</th><th>Quantity</th><th></th></tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.id}>
                      <td>
                        <ProductSelect products={products} value={l.product} placeholder="Select…"
                          hideSupplies
                          aria-label={`Product for line ${i + 1}`}
                          onChange={(pid) => setLineProduct(i, pid)}
                          onCreated={(row) => setProducts(ps => [...ps, row])} />
                      </td>
                      <td className="num muted">{l.product ? (stock[l.product] ?? 0) : '·'}</td>
                      <td><input className="input" type="number" min="0" step="any" aria-label={`Quantity for line ${i + 1}`} value={l.qty} onChange={setLine(i, 'qty')} placeholder="0" style={{ maxWidth: 120 }} /></td>
                      <td className="right"><button type="button" className="btn btn-secondary btn-sm" onClick={() => removeLine(i)} disabled={lines.length === 1}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="button" className="btn btn-secondary" onClick={addLine}>+ Add line</button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Recording…</> : 'Record sale'}</button>
            </div>
          </div>
        </form>
      )}

      <h2 className="section-title">Recent sales</h2>
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Date</th><th>Order</th><th>SKU</th><th>Product</th><th>Batch deducted</th><th className="right">Qty</th></tr></thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td className="num">{r.effective_date}</td>
                  <td className="muted">{r.order_ref}</td>
                  <td className="num">{r.products?.sku}</td>
                  <td>{r.products?.name}</td>
                  <td className="num muted">{r.batches?.code}{r.batches?.expiry_date ? ` (exp ${r.batches.expiry_date})` : ''}</td>
                  <td className="num right">{Number(r.qty)}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan="6"><div className="empty">No sales yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
