import { Fragment, useEffect, useMemo, useState } from 'react'
import { listProducts, productStockMap, batchStatus } from '../lib/api'
import { categoriesOf, groupByCategory, productCategory } from '../lib/catalog'
import { SkeletonRows } from '../components/Skeleton'
import Banner from '../components/Banner'
import SearchInput from '../components/SearchInput'

function StateBadge({ state }) {
  const map = {
    ok: ['badge-ok', 'OK'], near: ['badge-soon', 'Near-Expiry'],
    expired: ['badge-exp', 'Expired'], none: ['badge-info', 'No expiry'],
  }
  const [cls, label] = map[state] ?? ['badge-info', state]
  return <span className={`badge ${cls}`}><span className="dot" />{label}</span>
}

function productBadge(onHand, batches, reorder) {
  if (onHand <= 0) return <span className="badge badge-exp"><span className="dot" />Out of stock</span>
  const expired = batches.some(b => b.expiry_state === 'expired' && Number(b.on_hand) > 0)
  const near = batches.some(b => b.expiry_state === 'near' && Number(b.on_hand) > 0)
  const low = reorder != null && onHand <= Number(reorder)
  if (expired) return <span className="badge badge-exp"><span className="dot" />Expired stock</span>
  if (near) return <span className="badge badge-soon"><span className="dot" />Near-Expiry</span>
  if (low) return <span className="badge badge-low"><span className="dot" />Low Stock</span>
  return <span className="badge badge-ok"><span className="dot" />In Stock</span>
}

export default function Stock() {
  const [products, setProducts] = useState([])
  const [stock, setStock] = useState({})
  const [batches, setBatches] = useState([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [open, setOpen] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    Promise.all([listProducts(), productStockMap(), batchStatus()])
      .then(([p, s, b]) => { setProducts(p); setStock(s); setBatches(b) })
      .catch(e => setMsg({ type: 'err', text: e.message }))
      .finally(() => setLoading(false))
  }, [])

  const byProduct = useMemo(() => {
    const m = {}
    for (const b of batches) (m[b.product_id] ??= []).push(b)
    return m
  }, [batches])

  const toggle = (id) => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const rows = products.filter(p =>
    (cat === 'all' || productCategory(p) === cat) &&
    (!q || p.sku.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase())))

  return (
    <div>
      <div className="page-head"><h1>Current Stock</h1><div className="sub">Live on-hand by product. Click a row to see its batches.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="toolbar">
        <SearchInput value={q} onChange={e => setQ(e.target.value)} placeholder="Search SKU or name…" />
        <select className="select" value={cat} onChange={e => setCat(e.target.value)} aria-label="Filter by category" style={{ maxWidth: 190 }}>
          <option value="all">All categories</option>
          {categoriesOf(products).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th scope="col" style={{ width: 28 }}><span className="sr-only">Details</span></th><th scope="col">SKU</th><th scope="col">Product</th><th scope="col" className="right">On hand</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {groupByCategory(rows).map(g => (
                <Fragment key={g.cat}>
                  <tr className="cat-row"><td colSpan="5">{g.cat}</td></tr>
                  {g.items.map(p => {
                    const oh = stock[p.id] ?? 0
                    const bs = (byProduct[p.id] ?? []).filter(b => Number(b.on_hand) !== 0)
                    const isOpen = open.has(p.id)
                    return (
                      <Fragment key={p.id}>
                    <tr className="rowlink" tabIndex={0} role="button" aria-expanded={isOpen}
                      onClick={() => toggle(p.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(p.id) } }}>
                      <td className="muted">{bs.length ? (isOpen ? '▾' : '▸') : ''}</td>
                      <td className="num">{p.sku}</td>
                      <td>{p.name}</td>
                      <td className="num right">{oh}</td>
                      <td>{productBadge(oh, byProduct[p.id] ?? [], p.reorder_point)}</td>
                    </tr>
                    {isOpen && bs.map(b => (
                      <tr key={b.batch_id} style={{ background: 'var(--surface-2)' }}>
                        <td></td>
                        <td className="num muted">{b.code}</td>
                        <td className="muted">Expiry: {b.expiry_date ?? '·'}</td>
                        <td className="num right">{Number(b.on_hand)}</td>
                        <td><StateBadge state={b.expiry_state} /></td>
                      </tr>
                    ))}
                    {isOpen && bs.length === 0 && (
                      <tr style={{ background: 'var(--surface-2)' }}><td></td><td colSpan="4" className="muted">No stock on hand.</td></tr>
                    )}
                      </Fragment>
                    )
                  })}
                </Fragment>
              ))}
              {loading && <SkeletonRows cols={5} />}
              {!loading && rows.length === 0 && <tr><td colSpan="5"><div className="empty">No products found.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
