import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { listEvents, createEvent } from '../lib/api'
import Loading from '../components/Loading'
import Banner from '../components/Banner'

const today = () => new Date().toISOString().slice(0, 10)

function statusBadge(s) {
  if (s === 'active') return <span className="badge badge-soon"><span className="dot" />Active</span>
  if (s === 'closed') return <span className="badge badge-ok"><span className="dot" />Closed</span>
  return <span className="badge badge-info">{s}</span>
}

export default function Events() {
  const nav = useNavigate()
  const [events, setEvents] = useState([])
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [start, setStart] = useState(today())
  const [end, setEnd] = useState(today())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  async function load() { try { setEvents(await listEvents()) } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return setMsg({ type: 'err', text: 'Event name is required.' })
    if (end < start) return setMsg({ type: 'err', text: 'End date cannot be before the start date.' })
    setSaving(true); setMsg(null)
    try {
      const ev = await createEvent({ name: name.trim(), venue: venue.trim() || null, start_date: start, end_date: end })
      nav(`/events/${ev.id}`)
    } catch (e) { setMsg({ type: 'err', text: e.message }); setSaving(false) }
  }

  return (
    <div>
      <div className="page-head"><h1>Events</h1><div className="sub">Release stock to an event, then reconcile everything when it ends.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <form className="card mb-block" onSubmit={submit}>
        <h2 className="card-h">New event</h2>
        <div className="card-b">
          <div className="form-grid">
            <div className="field"><label htmlFor="ev-name">Name *</label><input id="ev-name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Makati Weekend Bazaar" /></div>
            <div className="field"><label htmlFor="ev-venue">Venue</label><input id="ev-venue" className="input" value={venue} onChange={e => setVenue(e.target.value)} placeholder="optional" /></div>
            <div className="field"><label htmlFor="ev-start">Start</label><input id="ev-start" className="input" type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
            <div className="field"><label htmlFor="ev-end">End</label><input id="ev-end" className="input" type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
            <div className="field" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Creating…</> : 'Create & open'}</button></div>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th scope="col">Event</th><th scope="col">Venue</th><th scope="col">Dates</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} className="rowlink" onClick={() => nav(`/events/${ev.id}`)}>
                  <td><Link to={`/events/${ev.id}`} onClick={(e) => e.stopPropagation()}>{ev.name}</Link></td>
                  <td className="muted">{ev.venue || '·'}</td>
                  <td className="num muted">{ev.start_date} → {ev.end_date}</td>
                  <td>{statusBadge(ev.status)}</td>
                </tr>
              ))}
              {loading && <tr><td colSpan="4"><Loading /></td></tr>}
              {!loading && events.length === 0 && <tr><td colSpan="4"><div className="empty">No events yet. Create one above.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
