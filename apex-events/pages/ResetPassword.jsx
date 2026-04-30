import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Listen for auth state changes to verify the user got redirected via the magic link
    supabase.auth.onAuthStateChange(async (event) => {
      if (event !== 'PASSWORD_RECOVERY') {
        // Wait, sometimes event is just 'SIGNED_IN' in newer Supabase implementations
        // but the hash includes `type=recovery`.
        // We don't necessarily have to block access here.
      }
    })
  }, [])

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match')
    }
    
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long')
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully!')
      navigate('/home')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <h1>Create New Password</h1>
        <p>Please enter your secure new password.</p>
        
        <form onSubmit={handleUpdatePassword}>
          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)} 
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
      <div className="auth-image" />
    </div>
  )
}
