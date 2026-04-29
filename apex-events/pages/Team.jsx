import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

const ROLES = ['member', 'admin', 'viewer']

export default function Team({ profile }) {
  const storageKey = `apex:team:${profile?.id || 'anon'}`
  const [members, setMembers] = useState([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('member')

  useEffect(() => {
    try {
      setMembers(JSON.parse(localStorage.getItem(storageKey) || '[]'))
    } catch {
      setMembers([])
    }
  }, [storageKey])

  const persist = (next) => {
    localStorage.setItem(storageKey, JSON.stringify(next))
    setMembers(next)
  }

  const handleInvite = (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Enter a name or email'); return }
    persist([{ id: Date.now(), name: name.trim(), role }, ...members])
    setName('')
    setRole('member')
    toast.success('Team member added')
  }

  const handleRemove = (id) => {
    persist(members.filter((m) => m.id !== id))
    toast.success('Member removed')
  }

  const handleRoleChange = (id, newRole) => {
    persist(members.map((m) => m.id === id ? { ...m, role: newRole } : m))
  }

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <div>
          <h1>Team</h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.35rem' }}>
            Manage co-organiser access for your events.{' '}
            <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 999 }}>
              Local demo
            </span>
          </p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        <div className="card">
          <div className="card-header"><h3>Invite member</h3></div>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-field">
              <label>Name or email</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <button className="btn-accent" type="submit">Add member</button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '0.9rem 1rem', background: 'var(--bg)', borderRadius: 12, fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.35rem' }}>Role permissions</strong>
            <strong>Admin</strong> — full event management access<br />
            <strong>Member</strong> — can view and edit events<br />
            <strong>Viewer</strong> — read-only access to event stats
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Members ({members.length})</h3>
          </div>
          {members.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-icon"><Users size={32} /></div>
              <h3>No team members yet</h3>
              <p>Add co-organisers to collaborate on your events.</p>
            </div>
          ) : (
            <div className="list-card">
              {members.map((m) => (
                <div key={m.id} className="list-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #FFB347)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.82rem', flexShrink: 0 }}>
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="list-row-info">
                      <strong>{m.name}</strong>
                      <span className={`role-badge ${m.role}`}>{m.role}</span>
                    </div>
                  </div>
                  <div className="list-row-actions">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                    <button className="btn-outline" onClick={() => handleRemove(m.id)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
