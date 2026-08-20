import { useEffect, useState } from 'react'
import { expiringBatches, writeOff } from '../lib/api'
import ConfirmDialog from '../components/ConfirmDialog'
import Loading from '../components/Loading'
import Banner from '../components/Banner'
import { useToast } from '../components/Toast'

const today = () => new Date().toISOString().slice(0, 10)

export default function Expiry() {
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(null)
  const [confirmB, setConfirmB] = useState(null)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  async function load() { try { setRows(await expiringBatches()) } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  async function doWriteOff(b) {
    setBusy(b.batch_id); setConfirmB(null); setMsg(null)
    try {
      await writeOff({ product: b.product_id, batch: b.batch_id, type: 'EXPIRED', qty: Number(b.on_hand), note: 'Expired stock', effective: today() })
      toast.success(`Wrote off ${Number(b.on_hand)} expired unit(s) of ${b.product?.sku}.`)
      load()
    } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setBusy(null) }
  }

  const near = rows.filter(r => r.expiry_state === 'near')
  const expired = rows.filter(r => r.expiry_state === 'expired')

  return (
    <div>
      <div className="page-head"><h1>Expiry Monitor</h1><div className="sub">Batches nearing expiry or already expired. Write off expired stock in one click.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="tiles" style={{ marginBottom: 20 }}>
        <div className="tile"><div className="label">Near-expiry batches</div><div className="v num warn">{loading ? '·' : near.length}</div></div>
        <div className="tile"><div className="label">Expired batches</div><div className="v num bad">{loading ? '·' : expired.length}</div></div>
      </div>

      <h2 className="section-title">Expired, needs write-off</h2>
      <div className="card mb-block">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th scope="col">SKU</th><th scope="col">Product</th><th scope="col">Batch</th><th scope="col">Expired on</th><th scope="col" className="right">On hand</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {expired.map(b => (
                <tr key={b.batch_id}>
                  <td className="num">{b.product?.sku}</td>
                  <td>{b.product?.name}</td>
                  <td className="num muted">{b.code}</td>
                  <td className="num"><span className="badge badge-exp"><span className="dot" />{b.expiry_date}</span></td>
                  <td className="num right">{Number(b.on_hand)}</td>
                  <td className="right"><button className="btn btn-danger btn-sm" disabled={busy === b.batch_id} onClick={() => setConfirmB(b)}>{busy === b.batch_id ? '…' : 'Write off'}</button></td>
                </tr>
              ))}
              {loading && <tr><td colSpan="6"><Loading /></td></tr>}
              {!loading && expired.length === 0 && <tr><td colSpan="6"><div className="empty">No expired stock.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="section-title">Near-expiry, sell soon</h2>
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th scope="col">SKU</th><th scope="col">Product</th><th scope="col">Batch</th><th scope="col">Expires</th><th scope="col" className="right">On hand</th></tr></thead>
            <tbody>
              {near.map(b => (
                <tr key={b.batch_id}>
                  <td className="num">{b.product?.sku}</td>
                  <td>{b.product?.name}</td>
                  <td className="num muted">{b.code}</td>
                  <td className="num"><span className="badge badge-soon"><span className="dot" />{b.expiry_date}</span></td>
                  <td className="num right">{Number(b.on_hand)}</td>
                </tr>
              ))}
              {loading && <tr><td colSpan="5"><Loading /></td></tr>}
              {!loading && near.length === 0 && <tr><td colSpan="5"><div className="empty">Nothing nearing expiry.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {confirmB && (
        <ConfirmDialog
          title="Write off expired stock?"
          message={`Write off all ${Number(confirmB.on_hand)} expired unit(s) of ${confirmB.product?.sku} (batch ${confirmB.code})? This removes them from stock.`}
          confirmLabel="Write off" danger busy={busy === confirmB.batch_id}
          onConfirm={() => doWriteOff(confirmB)} onCancel={() => setConfirmB(null)}
        />
      )}
    </div>
  )
}
