import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import Icon from '../components/Icon'
import Banner from '../components/Banner'
import { useToast } from '../components/Toast'
import {
  getEvent, eventReconcile, listProducts,
  eventRelease, eventConsume, eventReturnStock, closeEvent,
} from '../lib/api'

const today = () => new Date().toISOString().slice(0, 10)

export default function EventDetail() {
  const { id } = useParams()
  const { isManager } = useAuth()
  const [event, setEvent] = useState(null)
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const toast = useToast()

  // form states
  const [relProd, setRelProd] = useState(''); const [relQty, setRelQty] = useState('')
  const [movProd, setMovProd] = useState(''); const [movType, setMovType] = useState('EVENT_SALE'); const [movQty, setMovQty] = useState('')
  const [retProd, setRetProd] = useState(''); const [retQty, setRetQty] = useState('')

  async function load() {
    try {
      const [ev, rec, prods] = await Promise.all([getEvent(id), eventReconcile(id), listProducts()])
      setEvent(ev); setRows(rec); setProducts(prods)
    } catch (e) { setMsg({ type: 'err', text: e.message }) }
  }
  useEffect(() => { load() }, [id])

  const poolProducts = useMemo(() => rows.filter(r => Number(r.remaining) > 0), [rows])
  const totalRemaining = rows.reduce((s, r) => s + Number(r.remaining), 0)
  const active = event?.status === 'active'

  async function run(fn, okText) {
    setBusy(true); setMsg(null)
    try { await fn(); toast.success(okText); await load(); return true }
    catch (e) { setMsg({ type: 'err', text: e.message }); return false } finally { setBusy(false) }
  }

  const doRelease = () => {
    if (!relProd || !(Number(relQty) > 0)) return setMsg({ type: 'err', text: 'Pick a product and quantity to release.' })
    run(() => eventRelease({ event: id, product: relProd, qty: Number(relQty), effective: today() }), 'Stock released to the event.').then(ok => { if (ok) { setRelQty(''); setRelProd('') } })
  }
  const doMovement = () => {
    if (!movProd || !(Number(movQty) > 0)) return setMsg({ type: 'err', text: 'Pick a product and quantity.' })
    run(() => eventConsume({ event: id, product: movProd, qty: Number(movQty), type: movType, effective: today() }), 'Event movement recorded.').then(ok => { if (ok) { setMovQty(''); setMovProd('') } })
  }
  const doReturn = () => {
    if (!retProd || !(Number(retQty) > 0)) return setMsg({ type: 'err', text: 'Pick a product and quantity to return.' })
    run(() => eventReturnStock({ event: id, product: retProd, qty: Number(retQty), effective: today() }), 'Stock returned to the warehouse.').then(ok => { if (ok) { setRetQty(''); setRetProd('') } })
  }
  const doClose = () => { setConfirmClose(false); run(() => closeEvent(id), 'Event closed and reconciled.') }

  if (!event) return (
    msg?.type === 'err'
      ? <div><div className="page-head"><Link to="/events" className="muted" style={{ fontSize: 13, textDecoration: 'none' }}>← All events</Link><h1 style={{ marginTop: 6 }}>Event</h1></div><Banner msg={msg} /></div>
      : <div className="splash">Loading…</div>
  )

  return (
    <div>
      <div className="page-head">
        <Link to="/events" className="muted" style={{ fontSize: 13, textDecoration: 'none' }}>← All events</Link>
        <h1 style={{ marginTop: 6 }}>{event.name} {event.status === 'active' ? <span className="badge badge-soon"><span className="dot" />Active</span> : <span className="badge badge-ok"><span className="dot" />Closed</span>}</h1>
        <div className="sub">{event.venue || 'No venue'} · {event.start_date} → {event.end_date}</div>
      </div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      {active && (
        <div className="form-grid" style={{ marginBottom: 22 }}>
          <div className="card">
            <div className="card-h" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="upload" size={16} />Release to event</div>
            <div className="card-b">
              <div className="field" style={{ marginBottom: 10 }}><label htmlFor="ed-rel-prod">Product</label>
                <select id="ed-rel-prod" className="select" value={relProd} onChange={e => setRelProd(e.target.value)}>
                  <option value="">Select…</option>{products.map(p => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
                </select></div>
              <div className="toolbar" style={{ marginBottom: 0 }}>
                <input className="input" type="number" min="0" aria-label="Release quantity" placeholder="Qty" value={relQty} onChange={e => setRelQty(e.target.value)} />
                <button className="btn btn-secondary" onClick={doRelease} disabled={busy}>Release</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="cart" size={16} />Record at event</div>
            <div className="card-b">
              <div className="field" style={{ marginBottom: 10 }}><label htmlFor="ed-mov-prod">Product (in pool)</label>
                <select id="ed-mov-prod" className="select" value={movProd} onChange={e => setMovProd(e.target.value)}>
                  <option value="">Select…</option>{poolProducts.map(r => <option key={r.product_id} value={r.product_id}>{r.product?.sku} · {r.product?.name} ({Number(r.remaining)} left)</option>)}
                </select></div>
              <div className="toolbar" style={{ marginBottom: 0 }}>
                <select className="select" aria-label="Movement type" style={{ maxWidth: 140 }} value={movType} onChange={e => setMovType(e.target.value)}>
                  <option value="EVENT_SALE">Sale</option><option value="SAMPLE">Sample</option><option value="DAMAGE">Damage</option>
                </select>
                <input className="input" type="number" min="0" aria-label="Quantity" placeholder="Qty" value={movQty} onChange={e => setMovQty(e.target.value)} />
                <button className="btn btn-secondary" onClick={doMovement} disabled={busy}>Record</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="download" size={16} />Return to warehouse</div>
            <div className="card-b">
              <div className="field" style={{ marginBottom: 10 }}><label htmlFor="ed-ret-prod">Product (in pool)</label>
                <select id="ed-ret-prod" className="select" value={retProd} onChange={e => setRetProd(e.target.value)}>
                  <option value="">Select…</option>{poolProducts.map(r => <option key={r.product_id} value={r.product_id}>{r.product?.sku} · {r.product?.name} ({Number(r.remaining)} left)</option>)}
                </select></div>
              <div className="toolbar" style={{ marginBottom: 0 }}>
                <input className="input" type="number" min="0" aria-label="Return quantity" placeholder="Qty" value={retQty} onChange={e => setRetQty(e.target.value)} />
                <button className="btn btn-secondary" onClick={doReturn} disabled={busy}>Return</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-h">Reconciliation</div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th scope="col">SKU</th><th scope="col">Product</th><th scope="col" className="right">Released</th><th scope="col" className="right">Sold</th><th scope="col" className="right">Samples</th><th scope="col" className="right">Damage</th><th scope="col" className="right">Returned</th><th scope="col" className="right">Remaining</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.product_id}>
                  <td className="num">{r.product?.sku}</td>
                  <td>{r.product?.name}</td>
                  <td className="num right">{Number(r.released)}</td>
                  <td className="num right">{Number(r.sold)}</td>
                  <td className="num right">{Number(r.samples)}</td>
                  <td className="num right">{Number(r.damage)}</td>
                  <td className="num right">{Number(r.returned)}</td>
                  <td className="num right" style={{ fontWeight: 700, color: Number(r.remaining) === 0 ? 'var(--ok)' : 'var(--soon)' }}>{Number(r.remaining)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="8"><div className="empty">Nothing released yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {active && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
          <div className={`badge ${totalRemaining === 0 ? 'badge-ok' : 'badge-soon'}`}><span className="dot" />Unaccounted: {totalRemaining}</div>
          <div style={{ flex: 1 }} />
          {isManager
            ? <button className="btn btn-primary" onClick={() => setConfirmClose(true)} disabled={busy || totalRemaining !== 0} title={totalRemaining !== 0 ? 'Resolve unaccounted stock first' : ''}>Close event</button>
            : <span className="help">A manager closes the event once everything is reconciled.</span>}
        </div>
      )}

      {confirmClose && (
        <ConfirmDialog
          title="Close event?"
          message={`Close “${event.name}”? Everything is reconciled (0 unaccounted). This can’t be reopened.`}
          confirmLabel="Close event" busy={busy}
          onConfirm={doClose} onCancel={() => setConfirmClose(false)}
        />
      )}
    </div>
  )
}
