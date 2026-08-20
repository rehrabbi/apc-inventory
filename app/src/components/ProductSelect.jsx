import { useMemo, useState } from 'react'
import Modal from './Modal'
import Banner from './Banner'
import { useAuth } from '../auth/AuthContext'
import { useToast } from './Toast'
import { createProduct, listCategories, listUnits, sortProducts } from '../lib/api'
import { groupByCategory } from '../lib/catalog'

// Shared product picker: a family-grouped dropdown that also lets a manager add a brand-new
// product inline (via the "＋ Add new product…" option), which is then auto-selected.
// onChange receives the selected product id (string), not a DOM event.

const ADD = '__add_new_product__'
const BLANK = { sku: '', name: '', retail_price: '', category_id: '', unit_id: '', is_perishable: true }

export default function ProductSelect({
  products = [], value, onChange, onCreated, hideSupplies = false,
  id, className = 'select', disabled = false, style, placeholder = 'Select a product…', ...rest
}) {
  const { isManager } = useAuth()
  const toast = useToast()
  const [created, setCreated] = useState([])   // products made here, shown immediately even before parent reloads
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [cats, setCats] = useState([])
  const [units, setUnits] = useState([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  // Merge any just-created products with the parent list (dedup by id), then group by category.
  const groups = useMemo(() => {
    const byId = new Map()
    for (const p of [...products, ...created]) byId.set(p.id, p)
    let merged = sortProducts([...byId.values()])
    if (hideSupplies) merged = merged.filter(p => (p.categories?.name || '') !== 'Supplies')
    return groupByCategory(merged)
  }, [products, created, hideSupplies])

  function openModal() {
    setForm(BLANK); setErr(null); setOpen(true)
    if (!cats.length) listCategories().then(setCats).catch(() => {})
    if (!units.length) listUnits().then(setUnits).catch(() => {})
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function handleChange(e) {
    const v = e.target.value
    if (v === ADD) { openModal(); return }   // keep the current selection; open the create dialog
    onChange(v)
  }

  async function save() {
    if (!form.sku.trim() || !form.name.trim()) { setErr('SKU and name are required.'); return }
    setSaving(true); setErr(null)
    const payload = {
      sku: form.sku.trim(), name: form.name.trim(),
      category_id: form.category_id || null, unit_id: form.unit_id || null,
      is_perishable: form.is_perishable,
      retail_price: form.retail_price === '' ? null : Number(form.retail_price),
    }
    try {
      const row = await createProduct(payload)
      const catName = cats.find((c) => c.id === payload.category_id)?.name
      const withCat = catName ? { ...row, categories: { name: catName } } : row
      setCreated((c) => [...c, withCat])
      onChange(row.id)        // auto-select the new product
      onCreated?.(withCat)    // let the parent fold it into its own product list
      setOpen(false)
      toast.success(`Product ${row.sku} added.`)
    } catch (e) {
      setErr((e.code === '23505' || /duplicate key/i.test(e.message)) ? `SKU "${payload.sku}" already exists.` : e.message)
    } finally { setSaving(false) }
  }

  return (
    <>
      <select id={id} className={className} value={value} onChange={handleChange} disabled={disabled} style={style} {...rest}>
        <option value="">{placeholder}</option>
        {isManager && <option value={ADD}>＋ Add new product…</option>}
        {groups.map((g) => (
          <optgroup key={g.cat} label={g.cat}>
            {g.items.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
          </optgroup>
        ))}
      </select>

      {open && (
        <Modal
          title={<span>Add product</span>}
          onClose={() => { if (!saving) setOpen(false) }}
          busy={saving}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Saving…</> : 'Create & select'}</button>
          </>}
        >
          <Banner msg={err ? { type: 'err', text: err } : null} onClose={() => setErr(null)} />
          <div className="form-grid">
            <div className="field"><label htmlFor="ps-sku">SKU *</label><input id="ps-sku" className="input" value={form.sku} onChange={set('sku')} placeholder="APC-1001" /></div>
            <div className="field"><label htmlFor="ps-name">Name *</label><input id="ps-name" className="input" value={form.name} onChange={set('name')} placeholder="Product name" /></div>
            <div className="field"><label htmlFor="ps-price">Retail price (₱)</label><input id="ps-price" className="input" type="number" min="0" step="0.01" value={form.retail_price} onChange={set('retail_price')} placeholder="e.g. 1097.00" /></div>
            <div className="field"><label htmlFor="ps-cat">Category</label>
              <select id="ps-cat" className="select" value={form.category_id} onChange={set('category_id')}>
                <option value="">None</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="ps-unit">Unit</label>
              <select id="ps-unit" className="select" value={form.unit_id} onChange={set('unit_id')}>
                <option value="">None</option>{units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <label className="check"><input type="checkbox" checked={form.is_perishable} onChange={set('is_perishable')} /> Perishable (tracks expiry)</label>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
