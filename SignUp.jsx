import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, PartyPopper, Ticket } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function SignUp() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [role, setRole] = useState('guest')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    const fullName = `${form.firstName} ${form.lastName}`.trim()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: fullName, role } },
    })

    if (error) {
      toast.error(error.message)
    } else if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, role })
      toast.success('Account created!')
      navigate('/home')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-image" />
      <div className="auth-form-side">
        <button className="auth-back" onClick={() => navigate('/signin')}><ArrowLeft size={18} /></button>
        <h1>Create Account</h1>
        <p>Join APEX Events today</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { value: 'guest', label: 'Attend Events', sub: 'Browse & book tickets', icon: Ticket },
            { value: 'host', label: 'Host Events', sub: 'Create & manage events', icon: PartyPopper },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              style={{
                padding: '0.85rem 0.75rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: role === option.value ? '2px solid var(--accent)' : '1.5px solid rgba(0,0,0,0.1)',
                background: role === option.value ? 'var(--accent-light)' : 'rgba(255,255,255,0.6)',
                color: role === option.value ? 'var(--accent)' : 'var(--text2)',
                transition: 'all 0.15s',
                textAlign: 'center',
              }}
            >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><option.icon size={16} />{option.label}</div>
              <div style={{ fontSize: '0.72rem', marginTop: '0.2rem', opacity: 0.8 }}>{option.sub}</div>
            </button>
          ))}
        </div>
        <form onSubmit={handleSignUp}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input name="firstName" placeholder="First name" value={form.firstName} onChange={handle} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handle} required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Min 6 characters" value={form.password} onChange={handle} required minLength={6} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/signin">Sign in</Link></p>
      </div>
    </div>
  )
}