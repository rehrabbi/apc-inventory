import { useEffect, useState } from 'react'
import { changeLog } from '../lib/api'
import { SkeletonRows } from '../components/Skeleton'
import Banner from '../components/Banner'

export default function ChangeLog() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  useEffect(() => { changeLog().then(setRows).catch(e => setMsg({ type: 'err', text: e.message })).finally(() => setLoading(false)) }, [])

  return (
    <div>
      <div className="page-head"><h1>Change Log</h1><div className="sub">Admin & master-data changes (products, users, settings).</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">Entity</th><th scope="col">Action</th><th scope="col">Record</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="num">{new Date(r.at).toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td className="muted">{r.profiles?.full_name ?? '·'}</td>
                  <td>{r.entity}</td>
                  <td>{r.action}</td>
                  <td className="num muted">{r.record_ref}</td>
                </tr>
              ))}
              {loading && <SkeletonRows cols={5} />}
              {!loading && rows.length === 0 && <tr><td colSpan="5"><div className="empty">No changes logged yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
