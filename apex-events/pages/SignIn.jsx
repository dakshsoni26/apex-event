import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome back!')
      navigate('/home')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <button className="auth-back" onClick={() => navigate('/')}><ArrowLeft size={18} /></button>
        <h1>Sign in</h1>
        <p>Please log in to continue to your account.</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p className="auth-link" style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Forgot password?</Link>
          </p>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <div className="divider">or</div>
        <button className="btn-google" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} type="button">
          Continue with Google
        </button>
        <p className="auth-link">Need an account? <Link to="/signup">Create one</Link></p>
      </div>
      <div className="auth-image" />
    </div>
  )
}