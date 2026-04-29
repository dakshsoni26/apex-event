import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, QrCode, Ticket } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'

const EVENT_IMAGES = {
  music: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80',
  fashion: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
  conference: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80',
  social: 'https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=600&q=80',
}

const getEventImage = (type) =>
  EVENT_IMAGES[(type || '').toLowerCase()] ||
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80'

function TicketCard({ ticket, session, profile, branding, expanded, onToggle, cancelling, cancelConfirm, onRequestCancel, onConfirmCancel, onDismissCancel }) {
  const event = ticket.events
  const isPast = event?.start_date && new Date(event.start_date) <= new Date()
  const isOpen = expanded === ticket.id
  const isConfirming = cancelConfirm === ticket.id

  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
      <div style={{ height: 140, backgroundImage: `url(${getEventImage(event?.event_type)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '50px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {event?.event_type || 'Event'}
            </span>
            <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, marginTop: '0.35rem', lineHeight: 1.2 }}>{event?.title}</h3>
          </div>
          <span style={{ background: isPast ? 'rgba(0,0,0,0.45)' : 'rgba(5,150,105,0.88)', color: 'white', fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '50px', flexShrink: 0, marginLeft: '0.5rem' }}>
            {isPast ? 'Past' : 'Confirmed'}
          </span>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {event?.start_date && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text2)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <CalendarDays size={16} />
                {new Date(event.start_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            {event?.location && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text2)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={16} /> {event.location}
              </span>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--text2)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <Ticket size={16} />
              {ticket.ticket_count || 1} ticket{(ticket.ticket_count || 1) > 1 ? 's' : ''}
              {!event?.is_free && ticket.total_paid > 0 && ` · £${ticket.total_paid}`}
            </span>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ticket Code</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: '0.9rem', background: 'var(--accent-light)', color: 'var(--accent)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, letterSpacing: '0.12em' }}>
              {ticket.ticket_code}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onToggle(ticket.id)}
            style={{ flex: 1, padding: '0.85rem', background: isOpen ? 'var(--accent)' : 'var(--bg2)', color: isOpen ? 'white' : 'var(--text)', border: 'none', borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {isOpen ? 'Hide QR' : 'Show QR Code'}
          </button>

          {!isPast && !isConfirming && (
            <button
              onClick={() => onRequestCancel(ticket.id)}
              style={{ padding: '0.85rem 1.25rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            >
              Cancel
            </button>
          )}

          {!isPast && isConfirming && (
            <>
              <button
                onClick={() => onConfirmCancel(ticket.id)}
                disabled={cancelling === ticket.id}
                style={{ padding: '0.85rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {cancelling === ticket.id ? 'Cancelling...' : 'Confirm'}
              </button>
              <button
                onClick={onDismissCancel}
                style={{ padding: '0.85rem 1rem', background: 'var(--bg2)', color: 'var(--text)', border: 'none', borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Keep
              </button>
            </>
          )}
        </div>

        {isOpen && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center', padding: '2rem 1.5rem', background: 'white', borderRadius: '16px', border: `2px dashed ${branding?.brand_color || 'var(--border)'}` }}>
            {branding?.ticket_logo ? (
              <img src={branding.ticket_logo} alt="Organiser logo" style={{ height: 40, maxWidth: 160, objectFit: 'contain', display: 'block', margin: '0 auto 0.85rem' }} />
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 999, background: 'var(--accent-light)', color: 'var(--accent)', marginBottom: '0.85rem' }}>
                <QrCode size={22} />
              </div>
            )}
            <QRCodeSVG
              value={`APEX-TICKET:${ticket.ticket_code}|EVENT:${ticket.event_id}|GUEST:${session.user.id}`}
              size={200}
              level="H"
              includeMargin
              fgColor={branding?.brand_color || '#000000'}
            />
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: '1.2rem', fontWeight: 800, color: branding?.brand_color || 'var(--accent)', letterSpacing: '0.2em', marginBottom: '0.5rem', marginTop: '1rem' }}>
              {ticket.ticket_code}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.25rem' }}>
              {profile?.full_name || session.user.email}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
              {ticket.ticket_count || 1} ticket{(ticket.ticket_count || 1) > 1 ? 's' : ''}
              {!event?.is_free && ticket.total_paid > 0 && ` · £${ticket.total_paid}`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '1rem', padding: '0.5rem', background: 'var(--bg)', borderRadius: '8px' }}>
              {branding?.ticket_message || 'Present this QR code at the venue entrance'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function useBranding(userId) {
  const [branding, setBranding] = useState({ ticket_message: '', ticket_logo: '', brand_color: '' })
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(`apex:settings:${userId}`) || '{}')
      setBranding({
        ticket_message: s.ticket_message || '',
        ticket_logo: s.ticket_logo || '',
        brand_color: s.brand_color || '',
      })
    } catch { /* ignore */ }
  }, [userId])
  return branding
}

export default function MyTickets({ session, profile }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const branding = useBranding(session.user.id)

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('rsvps')
      .select('*, events(title, start_date, location, virtual_link, event_type, is_free, price, description)')
      .eq('guest_id', session.user.id)
      .order('created_at', { ascending: false })
    setTickets(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [session])

  const handleCancel = async (ticketId) => {
    setCancelling(ticketId)
    await supabase.from('rsvps').delete().eq('id', ticketId)
    setCancelConfirm(null)
    await fetchTickets()
    setCancelling(null)
  }

  const handleToggle = (ticketId) => {
    setExpanded((prev) => (prev === ticketId ? null : ticketId))
  }

  const upcoming = tickets.filter((t) => t.events?.start_date && new Date(t.events.start_date) > new Date())
  const past = tickets.filter((t) => !t.events?.start_date || new Date(t.events.start_date) <= new Date())

  const ticketCardProps = {
    session,
    profile,
    branding,
    expanded,
    onToggle: handleToggle,
    cancelling,
    cancelConfirm,
    onRequestCancel: (id) => setCancelConfirm(id),
    onConfirmCancel: handleCancel,
    onDismissCancel: () => setCancelConfirm(null),
  }

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <h1>My Tickets</h1>
        <Link to="/home" className="btn-accent">Browse Events</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loader" style={{ margin: '0 auto' }} />
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"><Ticket size={36} /></div>
          <h3>No tickets yet</h3>
          <p>Browse events and book your first ticket</p>
          <Link to="/home" className="btn-accent">Browse Events</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 className="section-title">Upcoming ({upcoming.length})</h2>
              {upcoming.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} {...ticketCardProps} />
              ))}
            </div>
          )}
          {past.length > 0 && (
            <div style={{ opacity: 0.72 }}>
              <h2 className="section-title" style={{ color: 'var(--text2)' }}>Past ({past.length})</h2>
              {past.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} {...ticketCardProps} />
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
