import { useEffect, useState } from 'react'
import { dashboardData } from '../lib/api'
import { txnLabel } from '../lib/labels'
import Icon from '../components/Icon'
import Banner from '../components/Banner'

const CardTitle = ({ icon, children }) => (
  <h2 className="card-h" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={icon} size={16} />{children}</h2>
)

export default function Dashboard() {
  const [d, setD] = useState(null)
  const [msg, setMsg] = useState(null)
  useEffect(() => { dashboardData().then(setD).catch(e => setMsg({ type: 'err', text: e.message })) }, [])

  if (msg) return <div><div className="page-head"><h1>Dashboard</h1></div><Banner msg={msg} /></div>
  if (!d) return <div className="splash">Loading…</div>

  const chanTotal = d.channel.online + d.channel.event
  const pct = (n) => chanTotal ? Math.round((n / chanTotal) * 100) : 0

  return (
    <div>
      <div className="page-head"><h1>Dashboard</h1><div className="sub">Stock health and sales insight (last 30 days).</div></div>

      <div className="tiles" style={{ marginBottom: 20 }}>
        <div className="tile"><div className="label">Total SKUs</div><div className="v num">{d.totalSkus}</div></div>
        <div className="tile"><div className="label">Units on hand</div><div className="v num">{d.unitsOnHand}</div></div>
        <div className="tile"><div className="label">Low stock</div><div className="v num warn">{d.low}</div></div>
        <div className="tile"><div className="label">Near-expiry</div><div className="v num warn">{d.near}</div></div>
        <div className="tile"><div className="label">Expired</div><div className="v num bad">{d.expired}</div></div>
        <div className="tile"><div className="label">Open events</div><div className="v num">{d.openEvents}</div></div>
      </div>

      <div className="form-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <CardTitle icon="trendUp">Top movers (30d)</CardTitle>
          <div className="table-wrap"><table className="data">
            <thead><tr><th scope="col">SKU</th><th scope="col">Product</th><th scope="col" className="right">Sold</th></tr></thead>
            <tbody>
              {d.topMovers.map(r => <tr key={r.sku}><td className="num">{r.sku}</td><td>{r.name}</td><td className="num right">{r.sold30}</td></tr>)}
              {d.topMovers.length === 0 && <tr><td colSpan="3"><div className="empty">No sales in the last 30 days.</div></td></tr>}
            </tbody>
          </table></div>
        </div>
        <div className="card">
          <CardTitle icon="trendDown">Slow movers (in stock)</CardTitle>
          <div className="table-wrap"><table className="data">
            <thead><tr><th scope="col">SKU</th><th scope="col">Product</th><th scope="col" className="right">Sold</th><th scope="col" className="right">On hand</th></tr></thead>
            <tbody>
              {d.slowMovers.map(r => <tr key={r.sku}><td className="num">{r.sku}</td><td>{r.name}</td><td className="num right">{r.sold30}</td><td className="num right">{r.onHand}</td></tr>)}
              {d.slowMovers.length === 0 && <tr><td colSpan="4"><div className="empty">No stock yet.</div></td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <CardTitle icon="clock">Days of stock left (soonest to run out)</CardTitle>
          <div className="table-wrap"><table className="data">
            <thead><tr><th scope="col">SKU</th><th scope="col">Product</th><th scope="col" className="right">On hand</th><th scope="col" className="right">Sold/day</th><th scope="col" className="right">Days left</th></tr></thead>
            <tbody>
              {d.velocityRows.map(r => (
                <tr key={r.sku}><td className="num">{r.sku}</td><td>{r.name}</td><td className="num right">{r.onHand}</td><td className="num right">{r.velocity}</td>
                  <td className="num right" style={{ fontWeight: 700, color: r.days <= 7 ? 'var(--crit)' : r.days <= 21 ? 'var(--soon)' : 'inherit' }}>{r.days}</td></tr>
              ))}
              {d.velocityRows.length === 0 && <tr><td colSpan="5"><div className="empty">Need some sales history to estimate.</div></td></tr>}
            </tbody>
          </table></div>
        </div>
        <div className="card">
          <CardTitle icon="cart">Sales channel (30d, units)</CardTitle>
          <div className="card-b">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Online</span><span className="num">{d.channel.online} · {pct(d.channel.online)}%</span></div>
            <div style={{ height: 10, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: `${pct(d.channel.online)}%`, height: '100%', background: 'var(--brand)' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Events</span><span className="num">{d.channel.event} · {pct(d.channel.event)}%</span></div>
            <div style={{ height: 10, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${pct(d.channel.event)}%`, height: '100%', background: 'var(--info)' }} /></div>
            {chanTotal === 0 && <div className="empty">No sales yet.</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-h">Recent activity</h2>
        <div className="table-wrap"><table className="data">
          <thead><tr><th scope="col">Date</th><th scope="col">Type</th><th scope="col">SKU</th><th scope="col" className="right">Qty</th><th scope="col">By</th></tr></thead>
          <tbody>
            {d.recent.map(r => <tr key={r.id}><td className="num">{r.effective_date}</td><td>{txnLabel(r.type)}</td><td className="num">{r.products?.sku}</td><td className="num right">{Number(r.qty)}</td><td className="muted">{r.profiles?.full_name}</td></tr>)}
            {d.recent.length === 0 && <tr><td colSpan="5"><div className="empty">No activity yet.</div></td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
