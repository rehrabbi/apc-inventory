import { useEffect, useMemo, useState } from 'react'
import { transactionHistory } from '../lib/api'
import { SkeletonRows } from '../components/Skeleton'
import Banner from '../components/Banner'
import SearchInput from '../components/SearchInput'

const INBOUND = ['RECEIPT', 'CUSTOMER_RETURN', 'EVENT_RETURN', 'ADJUST_IN']
const sign = (t) => t === 'SCRAP_RETURN' ? '' : (INBOUND.includes(t) ? '+' : '−')

export default function History() {
  const [rows, setRows] = useState([])
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  useEffect(() => { transactionHistory().then(setRows).catch(e => setMsg({ type: 'err', text: e.message })).finally(() => setLoading(false)) }, [])

  const types = useMemo(() => [...new Set(rows.map(r => r.type))].sort(), [rows])
  const shown = rows.filter(r => (!type || r.type === type) && (!q ||
    [r.products?.sku, r.products?.name, r.order_ref, r.note].some(v => (v ?? '').toLowerCase().includes(q.toLowerCase()))))

  return (
    <div>
      <div className="page-head"><h1>Transaction History</h1><div className="sub">Every stock movement, newest first. This log is immutable.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="toolbar">
        <select className="select" style={{ maxWidth: 200 }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <SearchInput value={q} onChange={e => setQ(e.target.value)} placeholder="Search SKU, order, note…" />
        <div className="spacer" />
        <span className="muted">{shown.length} of {rows.length}</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data zebra">
            <thead><tr><th scope="col">Date</th><th scope="col">Type</th><th scope="col">SKU</th><th scope="col">Product</th><th scope="col">Batch</th><th scope="col" className="right">Qty</th><th scope="col">By</th><th scope="col">Ref / reason / note</th></tr></thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.id}>
                  <td className="num">{r.effective_date}</td>
                  <td>{r.type}</td>
                  <td className="num">{r.products?.sku ?? '·'}</td>
                  <td>{r.products?.name ?? '·'}</td>
                  <td className="num muted">{r.batches?.code ?? '·'}</td>
                  <td className="num right">{sign(r.type)}{Number(r.qty)}</td>
                  <td className="muted">{r.profiles?.full_name ?? '·'}</td>
                  <td className="muted">{r.order_ref || r.reasons?.label || r.note || '·'}</td>
                </tr>
              ))}
              {loading && <SkeletonRows cols={8} />}
              {!loading && shown.length === 0 && <tr><td colSpan="8"><div className="empty">No transactions.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
