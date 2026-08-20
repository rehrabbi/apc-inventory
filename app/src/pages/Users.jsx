import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listUsers, addUser, updateUser } from '../lib/api'
import { SkeletonRows } from '../components/Skeleton'
import Banner from '../components/Banner'
import { useToast } from '../components/Toast'

export default function Users() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('staff')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const toast = useToast()

  async function load() { try { setUsers(await listUsers()) } catch (e) { setMsg({ type: 'err', text: e.message }) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    if (!email.trim()) return setMsg({ type: 'err', text: 'Email is required.' })
    setSaving(true); setMsg(null)
    try {
      await addUser({ email: email.trim().toLowerCase(), full_name: name.trim() || null, role })
      toast.success(`Invited ${email.trim()} as ${role}. They get access on their first Google sign-in.`)
      setEmail(''); setName(''); setRole('staff'); load()
    } catch (e) {
      setMsg({ type: 'err', text: e.message.includes('duplicate') ? 'That email is already on the list.' : e.message })
    } finally { setSaving(false) }
  }

  async function toggleActive(u) { try { await updateUser(u.id, { is_active: !u.is_active }); toast.success(`${u.email} ${u.is_active ? 'disabled' : 'enabled'}.`); load() } catch (e) { setMsg({ type: 'err', text: e.message }) } }
  async function changeRole(u, r) { try { await updateUser(u.id, { role: r }); toast.success(`Role updated for ${u.email}.`); load() } catch (e) { setMsg({ type: 'err', text: e.message }) } }

  return (
    <div>
      <div className="page-head"><h1>Users</h1><div className="sub">Only people on this list can sign in. Add their Google email and pick a role.</div></div>
      <Banner msg={msg} onClose={() => setMsg(null)} />

      <form className="card" style={{ marginBottom: 22 }} onSubmit={add}>
        <div className="card-b">
          <div className="form-grid">
            <div className="field"><label htmlFor="usr-email">Google email *</label><input id="usr-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="person@gmail.com" /></div>
            <div className="field"><label htmlFor="usr-name">Name</label><input id="usr-name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="optional" /></div>
            <div className="field"><label htmlFor="usr-role">Role</label>
              <select id="usr-role" className="select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="staff">Staff</option><option value="manager">Manager / Admin</option>
              </select>
            </div>
            <div className="field" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner spinner-sm" aria-hidden="true" />Adding…</> : '+ Add user'}</button></div>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th scope="col">Email</th><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.full_name || '·'}</td>
                  <td>
                    <select className="select" aria-label={`Role for ${u.email}`} style={{ maxWidth: 160 }} value={u.role}
                      onChange={e => changeRole(u, e.target.value)} disabled={u.id === profile?.id}>
                      <option value="staff">Staff</option><option value="manager">Manager / Admin</option>
                    </select>
                  </td>
                  <td>{u.is_active ? <span className="badge badge-ok"><span className="dot" />Active</span> : <span className="badge badge-exp"><span className="dot" />Disabled</span>}</td>
                  <td className="right">
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(u)} disabled={u.id === profile?.id}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
              {loading && <SkeletonRows cols={5} />}
              {!loading && users.length === 0 && <tr><td colSpan="5"><div className="empty">No users.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="help" style={{ marginTop: 10 }}>You can’t change your own role or disable yourself.</p>
    </div>
  )
}
