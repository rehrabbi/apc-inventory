import { useEffect, useState } from 'react'
import { getSettings, setSetting, listCategories, listUnits, listReasons, addLookup } from '../lib/api'
import Banner from '../components/Banner'
import { useToast } from '../components/Toast'

export default function Settings() {
  const [nearDays, setNearDays] = useState('')
  const [cats, setCats] = useState([])
  const [units, setUnits] = useState([])
  const [reasons, setReasons] = useState([])
  const [newCat, setNewCat] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newReasonKind, setNewReasonKind] = useState('writeoff')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function load() {
    try {
      const [s, c, u, r] = await Promise.all([getSettings(), listCategories(), listUnits(), listReasons()])
      setNearDays(s.near_expiry_days ?? '30'); setCats(c); setUnits(u); setReasons(r)
    } catch (e) { setMsg({ type: 'err', text: e.message }) }
  }
  useEffect(() => { load() }, [])

  async function saveNear() {
    if (!(Number(nearDays) > 0)) return setMsg({ type: 'err', text: 'Enter a positive number of days.' })
    setBusy(true)
    try { await setSetting('near_expiry_days', Number(nearDays)); toast.success(`Near-expiry warning set to ${nearDays} days.`) }
    catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setBusy(false) }
  }
  async function add(table, row, reset) {
    setBusy(true)
    try { await addLookup(table, row); reset(); load(); toast.success('Added.') }
    catch (e) { setMsg({ type: 'err', text: (e.code === '23505' || /duplicate key/i.test(e.message)) ? 'That already exists.' : e.message }) } finally { setBusy(false) }
  }

  return (
    <div>
      <div className="page-head"><h1>Settings</h1><div className="sub">Manager-only configuration and lists.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="card" style={{ marginBottom: 22 }}>
        <h2 className="card-h">Near-expiry warning</h2>
        <div className="card-b">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="field" style={{ maxWidth: 160 }}><label htmlFor="set-near">Warn within (days)</label>
              <input id="set-near" className="input" type="number" min="1" value={nearDays} onChange={e => setNearDays(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={saveNear} disabled={busy} style={{ alignSelf: 'flex-end' }}>Save</button>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="card">
          <h2 className="card-h">Categories</h2>
          <div className="card-b">
            <div className="toolbar"><input className="input" aria-label="New category" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category" />
              <button className="btn btn-secondary" disabled={busy} onClick={() => newCat.trim() && add('categories', { name: newCat.trim() }, () => setNewCat(''))}>Add</button></div>
            <div>{cats.map(c => <span key={c.id} className="badge badge-info" style={{ margin: 3 }}>{c.name}</span>)}</div>
          </div>
        </div>
        <div className="card">
          <h2 className="card-h">Units</h2>
          <div className="card-b">
            <div className="toolbar"><input className="input" aria-label="New unit" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="New unit" />
              <button className="btn btn-secondary" disabled={busy} onClick={() => newUnit.trim() && add('units', { name: newUnit.trim() }, () => setNewUnit(''))}>Add</button></div>
            <div>{units.map(u => <span key={u.id} className="badge badge-info" style={{ margin: 3 }}>{u.name}</span>)}</div>
          </div>
        </div>
        <div className="card full">
          <h2 className="card-h">Reasons (write-off & adjustment)</h2>
          <div className="card-b">
            <div className="toolbar">
              <input className="input" aria-label="New reason label" value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="New reason label" />
              <select className="select" aria-label="Reason kind" style={{ maxWidth: 160 }} value={newReasonKind} onChange={e => setNewReasonKind(e.target.value)}>
                <option value="writeoff">Write-off</option><option value="adjustment">Adjustment</option>
              </select>
              <button className="btn btn-secondary" disabled={busy} onClick={() => newReason.trim() && add('reasons', { label: newReason.trim(), kind: newReasonKind }, () => setNewReason(''))}>Add</button>
            </div>
            <div>{reasons.map(r => <span key={r.id} className="badge badge-info" style={{ margin: 3 }}>{r.label} · {r.kind}</span>)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
