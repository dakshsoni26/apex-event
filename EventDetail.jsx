import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Circle, Link2, MapPin, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { bannerClass } from '../utils/events'

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBC')

export default function EventDetail({ session, profile }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [guestBooking, setGuestBooking] = useState(null)
  const [saving, setSaving] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [rsvps, setRsvps] = useState([])
  const [cancellingRsvp, setCancellingRsvp] = useState(null)
  const [rsvpConfirm, setRsvpConfirm] = useState(null)

  const isHost = event?.host_id === session?.user?.id
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/home')
  }
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: eventData }, { count: bookingCount }, { data: guestRow }, { data: rsvpRows }, { data: savedRow }] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('rsvps').select('id', { count: 'exact', head: true }).eq('event_id', id),
        supabase.from('rsvps').select('*').eq('event_id', id).eq('guest_id', session.user.id).maybeSingle(),
        supabase.from('rsvps').select('id, guest_name, guest_email, ticket_count, status, created_at').eq('event_id', id).order('created_at', { ascending: false }),
        supabase.from('saved_events').select('id').eq('event_id', id).eq('user_id', session.user.id).maybeSingle(),
      ])

      setEvent(eventData || null)
      setCount(bookingCount || 0)
      setGuestBooking(guestRow || null)
      setRsvps(rsvpRows || [])
      setIsSaved(Boolean(savedRow))
      setLoading(false)
    }

    fetchData()
  }, [id, session.user.id])

  const maxTickets = Math.max(0, (event?.tickets_total || event?.capacity || 100) - count)
  const total = (event?.is_free ? 0 : Number(event?.price || 0)) * quantity

  const toggleSaved = async () => {
    if (isSaved) {
      await supabase.from('saved_events').delete().eq('event_id', event.id).eq('user_id', session.user.id)
      setIsSaved(false)
      toast.success('Removed from saved events')
    } else {
      await supabase.from('saved_events').insert({ event_id: event.id, user_id: session.user.id })
      setIsSaved(true)
      toast.success('Saved for later')
    }
  }

  const removeRsvp = async (rsvpId) => {
    setCancellingRsvp(rsvpId)
    const { error } = await supabase.from('rsvps').delete().eq('id', rsvpId)
    if (error) {
      toast.error(error.message)
    } else {
      setRsvps((prev) => prev.filter((r) => r.id !== rsvpId))
      setCount((prev) => Math.max(0, prev - 1))
      toast.success('RSVP removed')
    }
    setCancellingRsvp(null)
    setRsvpConfirm(null)
  }

  const bookTicket = async () => {
    if (quantity < 1) return
    navigate(`/checkout/${event.id}?quantity=${quantity}`)
  }

  if (loading) {
    return (
      <Layout profile={profile}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div className="loader" />
        </div>
      </Layout>
    )
  }

  if (!event) {
    return (
      <Layout profile={profile}>
        <div className="empty-state card">
          <div className="empty-icon"><Circle size={36} /></div>
          <h3>Event not found</h3>
          <p>The event may have been removed or you do not have access.</p>
          <Link to="/home" className="btn-accent">Back to events</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout profile={profile}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn-outline" onClick={handleBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </div>

      <div className={`event-detail-banner ${bannerClass(event.event_type)}`}>
        <div>
          <span className="badge">{event.event_type || 'Event'}</span>
          <h1>{event.title}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.85rem', color: 'white', opacity: 0.92, fontSize: '0.9rem' }}>
            {event.start_date && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><CalendarDays size={16} /> {formatDate(event.start_date)}</span>}
            {event.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={16} /> {event.location}</span>}
            {event.virtual_link && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Link2 size={16} /> Virtual event</span>}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <h3>About this event</h3>
            <button className="btn-outline" type="button" onClick={toggleSaved}>{isSaved ? 'Saved' : 'Save for later'}</button>
          </div>
          <p style={{ color: 'var(--text2)', lineHeight: 1.75, marginBottom: '1.5rem' }}>{event.description || 'No description has been added yet.'}</p>

          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card" style={{ padding: '1.1rem', background: 'var(--bg)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Ticketing</div>
              <strong>{event.is_free ? 'Free entry' : `£${event.price || 0}`}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: '0.35rem' }}>{maxTickets} tickets left</div>
            </div>
            <div className="card" style={{ padding: '1.1rem', background: 'var(--bg)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Booked</div>
              <strong>{count}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: '0.35rem' }}>RSVPs registered so far</div>
            </div>
          </div>

          {isHost && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="section-title" style={{ fontSize: '1.3rem' }}>Guest list</h3>
              {rsvps.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <h3>No RSVPs yet</h3>
                </div>
              ) : (
                <ul className="rsvp-list">
                  {rsvps.map((row) => (
                    <li key={row.id} className="rsvp-item">
                      <div className="rsvp-avatar">{(row.guest_name || 'G').slice(0, 2).toUpperCase()}</div>
                      <div className="rsvp-info">
                        <strong>{row.guest_name || 'Guest'}</strong>
                        <span>{row.guest_email || 'No email'}</span>
                      </div>
                      <div className="rsvp-badge">{row.ticket_count || 1} ticket{(row.ticket_count || 1) > 1 ? 's' : ''}</div>
                      {rsvpConfirm === row.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => removeRsvp(row.id)}
                            disabled={cancellingRsvp === row.id}
                            style={{ padding: '0.3rem 0.65rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                          >
                            {cancellingRsvp === row.id ? '…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRsvpConfirm(null)}
                            style={{ padding: '0.3rem 0.65rem', background: 'var(--bg2)', color: 'var(--text)', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                          >
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRsvpConfirm(row.id)}
                          title="Remove this RSVP"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '0.25rem', borderRadius: 6, flexShrink: 0 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {!event.is_free && (
                <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', background: 'var(--accent-light)', borderRadius: 12, fontSize: '0.83rem', color: 'var(--accent)', lineHeight: 1.6 }}>
                  <strong>Refunds:</strong> To issue a refund for a paid booking, go to your{' '}
                  <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>Stripe Dashboard → Payments</a>{' '}
                  and find the charge by guest email. Removing an RSVP here does not automatically trigger a Stripe refund.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="booking-card">
          <div className="price">{event.is_free ? 'Free' : `£${event.price || 0}`} <span>{event.is_free ? 'entry' : 'per ticket'}</span></div>
          <div style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{guestBooking ? 'You have already booked this event.' : 'Reserve your place in a few clicks.'}</div>

          {!isHost && (
            <>
              <div className="qty-control">
                <button className="qty-btn" type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>−</button>
                <div className="qty-num">{quantity}</div>
                <button className="qty-btn" type="button" onClick={() => setQuantity((current) => Math.min(maxTickets || 1, current + 1))}>+</button>
              </div>
              <div className="booking-info-row"><span>Tickets</span><span>{quantity}</span></div>
              <div className="booking-info-row"><span>Availability</span><span>{maxTickets} left</span></div>
              <div className="booking-total"><span>Total</span><span>{event.is_free ? 'Free' : `£${total.toFixed(2)}`}</span></div>
              <div className="booking-divider" />
              <button className="book-btn" onClick={bookTicket} disabled={saving || maxTickets <= 0 || Boolean(guestBooking)} type="button">
                {saving ? 'Booking...' : guestBooking ? 'Already booked' : event.is_free ? 'Continue to RSVP' : 'Continue to Stripe Checkout'}
              </button>
              <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>
                {event.virtual_link ? <span>Join link available after booking.</span> : <span>Tickets will be stored in your account.</span>}
              </div>
            </>
          )}

          {isHost && (
            <>
              <div className="booking-divider" />
              <button className="book-btn" type="button" onClick={() => navigate(`/events/${event.id}/edit`)}>Edit event</button>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}