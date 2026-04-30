import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './supabaseClient'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import HostDashboard from './pages/HostDashboard'
import GuestHome from './pages/GuestHome'
import CreateEvent from './pages/CreateEvent'
import EventDetail from './pages/EventDetail'
import Checkout from './pages/Checkout'
import MyTickets from './pages/MyTickets'
import SavedEvents from './pages/SavedEvents'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import Drafts from './pages/Drafts'
import Templates from './pages/Templates'
import Team from './pages/Team'
import WebhookLogs from './pages/WebhookLogs'
import PublicRSVP from './pages/PublicRSVP'
import EditEvent from './pages/EditEvent'
import ScanTicket from './pages/ScanTicket'
import Analytics from './pages/Analytics'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import './index.css'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/signin" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (user) => {
    if (!user) { setProfile(null); setLoading(false); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) { setProfile(data) }
    else {
      const meta = user.user_metadata
      const np = { id: user.id, full_name: meta?.full_name || user.email, role: meta?.role || 'guest' }
      await supabase.from('profiles').upsert(np)
      setProfile(np)
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      fetchProfile(session?.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      fetchProfile(session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a' }}>
      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '2rem', color: 'white', opacity: 0.5 }}>APEX</div>
    </div>
  )

  const isHost = profile?.role === 'host'

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem' } }} />
      <Routes>
        <Route path="/" element={session ? <Navigate to="/home" /> : <Landing />} />
        <Route path="/signin" element={session ? <Navigate to="/home" /> : <SignIn />} />
        <Route path="/signup" element={session ? <Navigate to="/home" /> : <SignUp />} />
        <Route path="/forgot-password" element={session ? <Navigate to="/home" /> : <ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/rsvp/:id" element={<PublicRSVP />} />
        <Route path="/events" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={
          <ProtectedRoute session={session}>
            {isHost ? <HostDashboard session={session} profile={profile} /> : <GuestHome session={session} profile={profile} />}
          </ProtectedRoute>
        } />
        <Route path="/events/create" element={<Navigate to="/create-event" replace />} />
        <Route path="/events/:id" element={<ProtectedRoute session={session}><EventDetail session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/events/:id/edit" element={
          <ProtectedRoute session={session}>
            {isHost ? <EditEvent session={session} profile={profile} /> : <Navigate to="/home" />}
          </ProtectedRoute>
        } />
        <Route path="/checkout/:id" element={<ProtectedRoute session={session}><Checkout session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute session={session}><MyTickets session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute session={session}><SavedEvents session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute session={session}><Calendar session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute session={session}><Settings session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/drafts" element={<ProtectedRoute session={session}><Drafts session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute session={session}><Templates session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute session={session}><Team session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/webhook-logs" element={<ProtectedRoute session={session}><WebhookLogs session={session} profile={profile} /></ProtectedRoute>} />
        <Route path="/scan" element={
          <ProtectedRoute session={session}>
            {isHost ? <ScanTicket session={session} profile={profile} /> : <Navigate to="/home" />}
          </ProtectedRoute>
        } />
        <Route path="/create-event" element={
          <ProtectedRoute session={session}>
            {isHost ? <CreateEvent session={session} profile={profile} /> : <Navigate to="/home" />}
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute session={session}>
            {isHost ? <Analytics session={session} profile={profile} /> : <Navigate to="/home" />}
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}