import { useEffect, useState } from 'react'
import { listProducts, batchesForProduct, listReasons, adjustStock } from '../lib/api'
import Banner from '../components/Banner'
import ProductSelect from '../components/ProductSelect'
import { useToast } from '../components/Toast'

const today = () => new Date().toISOString().slice(0, 10)

export default function Adjustments() {
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [reasons, setReasons] = useState([])
  const [productId, setProductId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [actual, setActual] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [eff, setEff] = useState(today())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const toast = useToast()

  useEffect(() => {
    listProducts().then(setProducts).catch(e => setMsg({ type: 'err', text: e.message }))
    listReasons('adjustment').then(setReasons).catch(() => {})
  }, [])
  useEffect(() => {
    setBatchId('')
    if (!productId) { setBatches([]); return }
    batchesForProduct(productId).then(setBatches).catch(e => setMsg({ type: 'err', text: e.message }))
  }, [productId])

  const currentBatch = batches.find(b => b.batch_id === batchId)
  const systemOnHand = currentBatch ? Number(currentBatch.on_hand) : null
  const diff = (actual !== '' && systemOnHand != null) ? Number(actual) - systemOnHand : null

  async function submit(e) {
    e.preventDefault()
    if (!productId || !batchId) return setMsg({ type: 'err', text: 'Pick a product and batch.' })
    if (actual === '' || Number(actual) < 0) return setMsg({ type: 'err', text: 'Enter the counted quantity (0 or more).' })
    if (!reason) return setMsg({ type: 'err', text: 'A reason is required for adjustments.' })
    setSaving(true); setMsg(null)
    try {
      await adjustStock({ product: productId, batch: batchId, actual: Number(actual), reason, note: note.trim() || null, effective: eff })
      toast.success(`Adjusted ${currentBatch?.code} to ${actual} (${diff > 0 ? '+' : ''}${diff}).`)
      setActual(''); setNote('')
      setBatches(await batchesForProduct(productId))
    } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-head"><h1>Adjustments / Stock Count</h1><div className="sub">Manager-only. Enter the physically counted quantity; the system records the correction with a reason.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <form className="card" onSubmit={submit}>
        <div className="card-b">
          <div className="form-grid">
            <div className="field full"><label htmlFor="adj-product">Product *</label>
              <ProductSelect id="adj-product" products={products} value={productId}
                onChange={setProductId} onCreated={(row) => setProducts(ps => [...ps, row])} />
            </div>
            <div className="field full"><label htmlFor="adj-batch">Batch *</label>
              <select id="adj-batch" className="select" value={batchId} onChange={e => setBatchId(e.target.value)} disabled={!productId}>
                <option value="">{productId ? (batches.length ? 'Select a batch…' : 'No stock on hand') : 'Pick a product first'}</option>
                {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.code}{b.lot_code ? ` · ${b.lot_code}` : ''} · {b.expiry_date ? `exp ${b.expiry_date}` : 'no expiry'} · system {Number(b.on_hand)}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="adj-system">System says</label><input id="adj-system" className="input" value={systemOnHand ?? ''} disabled /></div>
            <div className="field"><label htmlFor="adj-actual">Counted (actual) *</label>
              <input id="adj-actual" className="input" type="number" min="0" step="any" value={actual} onChange={e => setActual(e.target.value)} placeholder="0" />
            </div>
            <div className="field"><label>Difference</label>
              <div className="input" aria-live="polite" style={{ display: 'flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums', color: diff > 0 ? 'var(--ok)' : diff < 0 ? 'var(--crit)' : 'inherit' }}>{diff == null ? '·' : (diff > 0 ? `+${diff}` : diff)}</div>
            </div>
            <div className="field"><label htmlFor="adj-reason">Reason *</label>
              <select id="adj-reason" className="select" value={reason} onChange={e => setReason(e.target.value)}>
                <option value="">Select a reason…</option>
                {reasons.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="adj-eff">Adjusted on</label><input id="adj-eff" className="input" type="date" value={eff} onChange={e => setEff(e.target.value)} /></div>
            <div className="field full"><label htmlFor="adj-note">Note</label><input id="adj-note" className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="optional" /></div>
            <div className="field full" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Recording…</> : 'Record adjustment'}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
