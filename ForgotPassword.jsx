import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset link sent to your email!')
      navigate('/signin')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <button className="auth-back" onClick={() => navigate('/signin')}><ArrowLeft size={18} /></button>
        <h1>Reset Password</h1>
        <p>Enter your email to receive a password reset link.</p>
        
        <form onSubmit={handleReset}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="email@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <p className="auth-link">Remember your password? <Link to="/signin">Sign in</Link></p>
      </div>
      <div className="auth-image" />
    </div>
  )
}
