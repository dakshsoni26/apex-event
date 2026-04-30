import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, CircleCheck, MapPin } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { sendRSVPConfirmation } from '../emailService'
import toast from 'react-hot-toast'

export default function PublicRSVP() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ guest_name: '', guest_email: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('events').select('*').eq('id', id).single().then(({ data }) => {
      setEvent(data)
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('rsvps').insert({
      event_id: id,
      guest_name: form.guest_name,
      guest_email: form.guest_email,
      status: 'confirmed',
      ticket_count: 1,
      ticket_code: `APX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    })

    if (error) {
      toast.error('Could not submit RSVP. You may have already registered.')
      setSubmitting(false)
      return
    }

    const eventDate = event.start_date ? new Date(event.start_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBC'

    await sendRSVPConfirmation({
      guestName: form.guest_name,
      guestEmail: form.guest_email,
      eventName: event.title,
      eventDate,
      eventLocation: event.location || event.virtual_link || 'TBC',
    })

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="loader" /></div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff8f5 0%, #fef3f0 50%, #faf7f4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        {!event ? (
          <div style={{ textAlign: 'center' }}><h2>Event not found</h2></div>
        ) : submitted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent)' }}><CircleCheck size={56} /></div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', marginBottom: '0.5rem' }}>You&apos;re in!</h2>
            <p style={{ color: 'var(--text2)' }}>Your RSVP for <strong>{event.title}</strong> has been confirmed.</p>
            {event.start_date && <p style={{ marginTop: '0.75rem', color: 'var(--text2)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><CalendarDays size={16} /> {new Date(event.start_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            {event.location && <p style={{ color: 'var(--text2)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={16} /> {event.location}</p>}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="event-type-badge">{event.event_type || 'Event'}</span>
              <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', margin: '0.5rem 0' }}>{event.title}</h1>
              {event.start_date && <p style={{ color: 'var(--text2)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><CalendarDays size={16} /> {new Date(event.start_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
              {event.location && <p style={{ color: 'var(--text2)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={16} /> {event.location}</p>}
              {event.description && <p style={{ marginTop: '0.75rem', color: 'var(--text2)', lineHeight: 1.6, fontSize: '0.9rem' }}>{event.description}</p>}
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.875rem' }}>Your Name</label>
                <input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="Full name" required style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.875rem' }}>Email Address</label>
                <input type="email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} placeholder="email@example.com" required style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontFamily: 'DM Sans', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ borderRadius: '8px', margin: 0 }} disabled={submitting}>{submitting ? 'Confirming...' : 'Confirm RSVP'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}