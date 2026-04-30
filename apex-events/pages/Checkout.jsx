import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Circle, CreditCard, ShieldCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import OrderSummary from '../components/OrderSummary'
import { sendBookingConfirmation } from '../emailService'
import toast from 'react-hot-toast'

const formatMoney = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value || 0)
const generateTicketCode = () => `APX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const apiUrl = (path) => {
  const base = import.meta.env.VITE_STRIPE_API_URL?.trim()
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path}`
}

const isNetworkError = (error) => {
  const message = (error?.message || '').toLowerCase()
  return message.includes('failed to fetch') || message.includes('econnrefused') || message.includes('networkerror')
}

export default function Checkout({ session, profile }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const stripeSessionId = searchParams.get('session_id')
  const checkoutStatus = searchParams.get('status')
  const quantity = Math.max(1, Number(searchParams.get('quantity') || 1))
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const finalizedSessionRef = useRef(null)

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(data || null)
      setLoading(false)
    }

    fetchEvent()
  }, [id])

  const total = useMemo(() => {
    if (!event) return 0
    return (event.is_free ? 0 : Number(event.price || 0)) * quantity
  }, [event, quantity])

  const saveBooking = async ({ ticketCode, amountPaid }) => {
    if (!event) return

    const { data: existingBooking } = await supabase
      .from('rsvps')
      .select('id, ticket_code')
      .eq('event_id', event.id)
      .eq('guest_id', session.user.id)
      .maybeSingle()

    if (existingBooking) {
      return existingBooking.ticket_code || ticketCode
    }

    const { error } = await supabase.from('rsvps').insert({
      event_id: event.id,
      guest_id: session.user.id,
      guest_name: profile?.full_name || session.user.email,
      guest_email: session.user.email,
      ticket_count: quantity,
      ticket_code: ticketCode,
      total_paid: amountPaid,
      status: 'confirmed',
    })

    if (error) {
      toast.error(error.message)
      throw error
    }

    return ticketCode
  }

  const completeFreeBooking = async () => {
    if (!event) return
    setPaying(true)

    try {
      const ticketCode = generateTicketCode()
      await saveBooking({ ticketCode, amountPaid: 0 })
      await sendBookingConfirmation({
        to: session.user.email,
        toName: profile?.full_name,
        eventTitle: event.title,
        ticketCode,
        ticketCount: quantity,
        totalPaid: 0,
        isFree: true,
      })
      toast.success('RSVP confirmed')
      navigate('/my-tickets')
    } catch {
      // toast already shown
    } finally {
      setPaying(false)
    }
  }

  const startStripeCheckout = async () => {
    if (!event) return
    setPaying(true)
    setStatusMessage('Redirecting to Stripe Checkout...')

    try {
      const ticketCode = generateTicketCode()
      const response = await fetch(apiUrl('/api/stripe/create-checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          quantity,
          total,
          guestEmail: session.user.email,
          guestName: profile?.full_name || session.user.email,
          guestId: session.user.id,
          ticketCode,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not start Stripe Checkout')

      window.location.assign(data.url)
    } catch (error) {
      toast.error(isNetworkError(error) ? 'Stripe server is not running. Start npm run dev:full.' : error.message)
      setPaying(false)
      setStatusMessage('')
    }
  }

  useEffect(() => {
    if (!event || checkoutStatus !== 'success' || !stripeSessionId) return
    if (finalizedSessionRef.current === stripeSessionId) return
    finalizedSessionRef.current = stripeSessionId

    const finalizeStripeBooking = async () => {
      setFinalizing(true)
      setStatusMessage('Verifying Stripe payment...')

      try {
        const response = await fetch(apiUrl(`/api/stripe/session/${stripeSessionId}`))
        const data = await response.json()

        if (!response.ok) throw new Error(data.error || 'Could not verify Stripe payment')
        if (data.payment_status !== 'paid') throw new Error('Stripe has not marked this session as paid yet')

        const ticketCode = data.metadata?.ticket_code || generateTicketCode()
        const amountPaid = Number(data.amount_total || total * 100) / 100
        await saveBooking({ ticketCode, amountPaid })
        await sendBookingConfirmation({
          to: session.user.email,
          toName: profile?.full_name,
          eventTitle: event.title,
          ticketCode,
          ticketCount: quantity,
          totalPaid: amountPaid,
          isFree: false,
        })
        toast.success('Payment confirmed by Stripe')
        navigate('/my-tickets')
      } catch (error) {
        toast.error(isNetworkError(error) ? 'Could not reach the Stripe server. Start npm run dev:full.' : error.message)
      } finally {
        setFinalizing(false)
        setStatusMessage('')
      }
    }

    finalizeStripeBooking()
  }, [checkoutStatus, event, navigate, stripeSessionId, total])

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
          <h3>Checkout not available</h3>
          <p>We could not load this event.</p>
          <Link to="/home" className="btn-accent">Back to events</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <button type="button" className="btn-outline" onClick={() => navigate(`/events/${event.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to event
        </button>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}><CreditCard size={18} /> Stripe checkout</h3>
            <span className="event-type-badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>Test mode</span>
          </div>
          <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            This uses Stripe test mode. You will be redirected to hosted Stripe Checkout, and the RSVP will be saved only after Stripe confirms payment.
          </p>

          <div className="form-card" style={{ marginBottom: '1rem' }}>
            <h2>Payment handoff</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text2)', lineHeight: 1.6 }}>
              {checkoutStatus === 'success' ? 'Stripe approved this payment. We are confirming the booking now.' : 'You will leave this page to complete the payment in Stripe Checkout.'}
            </p>

            <div className="empty-state" style={{ textAlign: 'left', padding: '1rem', marginTop: '0.25rem' }}>
              <h3 style={{ marginBottom: '0.4rem' }}>Stripe Checkout</h3>
              <p style={{ marginBottom: 0 }}>Use Stripe test card 4242 4242 4242 4242, any future expiry, and any 3-digit CVC.</p>
            </div>
          </div>

          <div className="empty-state" style={{ textAlign: 'left', padding: '0' }}>
            <h3 style={{ marginBottom: '0.4rem' }}>Status</h3>
            <p style={{ marginBottom: 0 }}>{statusMessage || 'The payment will be created on the server and verified before the RSVP is saved.'}</p>
          </div>
        </div>

        <OrderSummary 
          event={event} 
          quantity={quantity}
          total={total}
          onQuantityChange={(newQty) => {
            // This would require state management or URL param update
            // For now, just update the local total
            window.location.search = `?quantity=${newQty}`
          }}
        />
        
        <div className="checkout-actions">
          <button className="btn-accent" type="button" onClick={event.is_free ? completeFreeBooking : startStripeCheckout} disabled={paying || finalizing} style={{ width: '100%' }}>
            {paying || finalizing ? (
              <>
                <span className="loader" style={{ width: '14px', height: '14px', marginRight: '0.5rem' }} />
                Processing...
              </>
            ) : event.is_free ? 'Confirm RSVP' : 'Pay with Stripe Checkout'}
          </button>
          
          <div style={{ marginTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <ShieldCheck size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
            <span>The secret key stays on the server. The browser only gets a hosted checkout URL and a verification response.</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}