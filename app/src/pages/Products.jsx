import { Fragment, useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { SkeletonRows } from '../components/Skeleton'
import { listProducts, productStockMap, listCategories, listUnits, createProduct, updateProduct } from '../lib/api'
import { categoriesOf, groupByCategory, productCategory } from '../lib/catalog'
import Banner from '../components/Banner'
import SearchInput from '../components/SearchInput'
import { useToast } from '../components/Toast'

const BLANK = { sku: '', name: '', category_id: '', unit_id: '', is_perishable: true, pack_size: '', retail_price: '', barcode: '', reorder_point: '', notes: '' }

const peso = (v) => v == null || v === '' ? '·' : `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Products() {
  const [products, setProducts] = useState([])
  const [stock, setStock] = useState({})
  const [cats, setCats] = useState([])
  const [units, setUnits] = useState([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null) // {type,text}
  const toast = useToast()

  async function load() {
    try {
      const [p, s, c, u] = await Promise.all([listProducts(), productStockMap(), listCategories(), listUnits()])
      setProducts(p); setStock(s); setCats(c); setUnits(u)
    } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openNew() { setForm(BLANK); setEditing('new') }
  function openEdit(p) {
    setForm({
      sku: p.sku, name: p.name, category_id: p.category_id ?? '', unit_id: p.unit_id ?? '',
      is_perishable: p.is_perishable, pack_size: p.pack_size ?? '', retail_price: p.retail_price ?? '', barcode: p.barcode ?? '',
      reorder_point: p.reorder_point ?? '', notes: p.notes ?? '',
    })
    setEditing(p)
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function save() {
    if (!form.sku.trim() || !form.name.trim()) { setMsg({ type: 'err', text: 'SKU and name are required.' }); return }
    setSaving(true); setMsg(null)
    const payload = {
      sku: form.sku.trim(), name: form.name.trim(),
      category_id: form.category_id || null, unit_id: form.unit_id || null,
      is_perishable: form.is_perishable,
      pack_size: form.pack_size === '' ? null : Number(form.pack_size),
      retail_price: form.retail_price === '' ? null : Number(form.retail_price),
      barcode: form.barcode.trim() || null,
      reorder_point: form.reorder_point === '' ? null : Number(form.reorder_point),
      notes: form.notes.trim() || null,
    }
    try {
      if (editing === 'new') await createProduct(payload)
      else await updateProduct(editing.id, payload)
      setEditing(null); toast.success(`Product ${payload.sku} saved.`); load()
    } catch (e) {
      setMsg({ type: 'err', text: (e.code === '23505' || /duplicate key/i.test(e.message)) ? `SKU "${payload.sku}" already exists.` : e.message })
    } finally { setSaving(false) }
  }

  const shown = products.filter(p =>
    (cat === 'all' || productCategory(p) === cat) &&
    (!q || p.sku.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase())))
  const groups = groupByCategory(shown)

  return (
    <div>
      <div className="page-head"><h1>Products</h1><div className="sub">Your SKU master list.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="toolbar">
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SKU or name…" />
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category" style={{ maxWidth: 190 }}>
          <option value="all">All categories</option>
          {categoriesOf(products).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={openNew}>+ Add product</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr>
              <th scope="col">SKU</th><th scope="col">Name</th><th scope="col">Category</th><th scope="col">Unit</th><th scope="col">Perishable</th><th scope="col" className="right">Retail price</th><th scope="col" className="right">On hand</th><th scope="col"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody>
              {groups.map(g => (
                <Fragment key={g.cat}>
                  <tr className="cat-row"><td colSpan="8">{g.cat}</td></tr>
                  {g.items.map(p => (
                    <tr key={p.id}>
                      <td className="num">{p.sku}</td>
                      <td>{p.name}</td>
                      <td>{p.categories?.name ?? '·'}</td>
                      <td>{p.units?.name ?? '·'}</td>
                      <td>{p.is_perishable ? 'Yes' : 'No'}</td>
                      <td className="num right">{peso(p.retail_price)}</td>
                      <td className="num right">{stock[p.id] ?? 0}</td>
                      <td className="right"><button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button></td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {loading && <SkeletonRows cols={8} />}
              {!loading && shown.length === 0 && <tr><td colSpan="8"><div className="empty">No products yet. Click “Add product” to create your first SKU.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal
          title={<span>{editing === 'new' ? 'Add product' : `Edit ${editing.sku}`}</span>}
          onClose={() => setEditing(null)}
          busy={saving}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Saving…</> : 'Save'}</button>
          </>}
        >
          <div className="form-grid">
            <div className="field"><label htmlFor="prod-sku">SKU *</label><input id="prod-sku" className="input" value={form.sku} onChange={set('sku')} placeholder="APC-1001" /></div>
            <div className="field"><label htmlFor="prod-name">Name *</label><input id="prod-name" className="input" value={form.name} onChange={set('name')} placeholder="Vitamin C Serum 30ml" /></div>
            <div className="field"><label htmlFor="prod-category">Category</label>
              <select id="prod-category" className="select" value={form.category_id} onChange={set('category_id')}>
                <option value="">None</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="prod-unit">Unit</label>
              <select id="prod-unit" className="select" value={form.unit_id} onChange={set('unit_id')}>
                <option value="">None</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="prod-pack">Pack size (ref)</label><input id="prod-pack" className="input" type="number" value={form.pack_size} onChange={set('pack_size')} placeholder="e.g. 24" /></div>
            <div className="field"><label htmlFor="prod-price">Retail price (₱)</label><input id="prod-price" className="input" type="number" min="0" step="0.01" value={form.retail_price} onChange={set('retail_price')} placeholder="e.g. 1097.00" /></div>
            <div className="field"><label htmlFor="prod-reorder">Reorder point</label><input id="prod-reorder" className="input" type="number" value={form.reorder_point} onChange={set('reorder_point')} placeholder="optional" /></div>
            <div className="field"><label htmlFor="prod-barcode">Barcode</label><input id="prod-barcode" className="input" value={form.barcode} onChange={set('barcode')} placeholder="optional" /></div>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <label className="check"><input type="checkbox" checked={form.is_perishable} onChange={set('is_perishable')} /> Perishable (tracks expiry)</label>
            </div>
            <div className="field full"><label htmlFor="prod-notes">Notes</label><input id="prod-notes" className="input" value={form.notes} onChange={set('notes')} placeholder="optional" /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
