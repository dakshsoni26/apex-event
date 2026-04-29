import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(serverDir, '../.env') })
dotenv.config({ path: path.resolve(serverDir, '.env'), override: false })

const app = express()
const port = Number(process.env.STRIPE_SERVER_PORT || 4242)
const appUrl = (process.env.VITE_APP_URL || 'http://localhost:5173').replace(/\/$/, '')
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null
const allowedOrigins = [appUrl, 'http://localhost:5173', 'http://127.0.0.1:5173']

// Supabase admin client — uses service role key to bypass RLS (server only)
const supabaseAdmin =
  process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use((req, res, next) => {
  if (!req.url.startsWith('/api/')) {
    req.url = '/api' + req.url;
  }
  next();
})

// ── Stripe webhook ────────────────────────────────────────────────────
// IMPORTANT: must be registered before express.json() so Stripe gets the raw body
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    console.warn('Stripe webhook not configured (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET)')
    return res.status(400).json({ error: 'Webhook not configured' })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }


  // Append event to webhook_logs.json for the UI
  try {
    const logsPath = path.resolve(serverDir, 'webhook_logs.json')
    const existing = fs.existsSync(logsPath) ? JSON.parse(fs.readFileSync(logsPath, 'utf8') || '[]') : []
    existing.unshift({ id: Date.now(), source: 'stripe', receivedAt: new Date().toISOString(), payload: { type: event.type, id: event.id, data: event.data?.object } })
    fs.writeFileSync(logsPath, JSON.stringify(existing.slice(0, 200), null, 2))
  } catch (logErr) {
    console.warn('Webhook log write failed:', logErr.message)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { event_id, guest_id, guest_email, guest_name, ticket_code, quantity } = session.metadata || {}

    if (!supabaseAdmin) {
      console.warn('Webhook: SUPABASE_SERVICE_ROLE_KEY not set — RSVP not saved via webhook')
      return res.json({ received: true })
    }

    if (event_id && guest_id) {
      const { data: existing } = await supabaseAdmin
        .from('rsvps')
        .select('id')
        .eq('event_id', event_id)
        .eq('guest_id', guest_id)
        .maybeSingle()

      if (!existing) {
        const { error } = await supabaseAdmin.from('rsvps').insert({
          event_id,
          guest_id,
          guest_email: guest_email || '',
          guest_name: guest_name || guest_email || '',
          ticket_count: Number(quantity) || 1,
          ticket_code: ticket_code || `APX-WH-${Date.now()}`,
          total_paid: session.amount_total ? session.amount_total / 100 : 0,
          status: 'confirmed',
        })
        if (error) console.error('Webhook: failed to save RSVP:', error.message)
        else console.log(`Webhook: RSVP saved for event ${event_id}, guest ${guest_id}`)
      } else {
        console.log(`Webhook: RSVP already exists for event ${event_id}, guest ${guest_id} — skipping`)
      }
    }
  }

  return res.json({ received: true })
})

// ── JSON body parsing for all other routes ────────────────────────────
app.use(express.json())

// ── Health check ──────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, stripeConfigured: Boolean(stripe) })
})

// ── Stripe checkout session ───────────────────────────────────────────
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured' })
  }

  const {
    eventId,
    eventTitle,
    quantity = 1,
    total,
    guestEmail,
    guestName,
    guestId,
    ticketCode,
  } = req.body || {}

  if (!eventId || !eventTitle) {
    return res.status(400).json({ error: 'Missing event data' })
  }

  const ticketQuantity = Math.max(1, Number(quantity) || 1)
  const totalAmount = Number(total)

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero' })
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: guestEmail || undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: ticketQuantity,
          price_data: {
            currency: 'gbp',
            unit_amount: Math.round((totalAmount * 100) / ticketQuantity),
            product_data: {
              name: eventTitle,
              description: `${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''} for ${eventTitle}`,
            },
          },
        },
      ],
      metadata: {
        event_id: String(eventId),
        event_title: String(eventTitle),
        quantity: String(ticketQuantity),
        guest_id: String(guestId || ''),
        guest_email: String(guestEmail || ''),
        guest_name: String(guestName || ''),
        ticket_code: String(ticketCode || ''),
      },
      success_url: `${appUrl}/checkout/${eventId}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/${eventId}?status=cancelled&quantity=${ticketQuantity}`,
    })

    return res.json({ id: checkoutSession.id, url: checkoutSession.url })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// Webhook receiver (basic delivery logging)
app.post('/api/webhooks', express.json(), async (req, res) => {
  try {
    const payload = req.body || {}
    const logsPath = path.resolve(serverDir, 'webhook_logs.json')
    const existing = fs.existsSync(logsPath) ? JSON.parse(fs.readFileSync(logsPath, 'utf8') || '[]') : []
    existing.unshift({ id: Date.now(), receivedAt: new Date().toISOString(), payload })
    fs.writeFileSync(logsPath, JSON.stringify(existing.slice(0, 200), null, 2))
    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.get('/api/webhooks/logs', (_req, res) => {
  try {
    const logsPath = path.resolve(serverDir, 'webhook_logs.json')
    const existing = fs.existsSync(logsPath) ? JSON.parse(fs.readFileSync(logsPath, 'utf8') || '[]') : []
    return res.json(existing)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// Refunds (test-mode helper)
app.post('/api/refunds', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured' })
  const { sessionId, reason } = req.body || {}
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' })
  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    const paymentIntentId = checkoutSession.payment_intent || checkoutSession.payment_intent?.id || null
    if (!paymentIntentId) return res.status(400).json({ error: 'No payment intent found on session' })
    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId, reason: reason || undefined })
    return res.json({ ok: true, refund })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

app.get('/api/refund-policy', (_req, res) => {
  return res.json({
    policy: 'All sales are final by default. Hosts may offer refunds within 14 days prior to the event start. Refunds are subject to host approval and Stripe processing times.'
  })
})

// ── Stripe session retrieval ──────────────────────────────────────────
app.get('/api/stripe/session/:sessionId', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured' })
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(req.params.sessionId)
    return res.json({
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      amount_total: checkoutSession.amount_total,
      metadata: checkoutSession.metadata || {},
      customer_email: checkoutSession.customer_email,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// ── Email config check ────────────────────────────────────────────────
app.get('/api/email-config', (_req, res) => {
  const hasKey = Boolean(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL || null
  res.json({ configured: hasKey, from, note: hasKey ? 'RESEND_API_KEY is set' : 'RESEND_API_KEY is missing' })
})

// ── Email (Resend) ────────────────────────────────────────────────────
app.post('/api/send-email', async (req, res) => {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  if (!resendApiKey) {
    console.warn('Email skipped: RESEND_API_KEY not set in .env')
    return res.json({ ok: true, skipped: true, reason: 'RESEND_API_KEY not set' })
  }

  const { to, toName, eventTitle, ticketCode, ticketCount, totalPaid, isFree } = req.body || {}

  if (!to || !eventTitle || !ticketCode) {
    return res.status(400).json({ error: 'Missing required email fields (to, eventTitle, ticketCode)' })
  }

  const displayName = toName || to
  const priceDisplay = isFree ? 'Free' : `£${Number(totalPaid || 0).toFixed(2)}`
  const ticketPlural = ticketCount > 1 ? 'tickets' : 'ticket'

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Sans',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#6c47ff,#ff6b6b);padding:40px;text-align:center;">
                <div style="font-size:2rem;font-weight:700;color:white;letter-spacing:0.1em;margin-bottom:8px;">APEX</div>
                <div style="color:rgba(255,255,255,0.85);font-size:0.95rem;">Booking Confirmed</div>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <p style="font-size:1rem;color:#12100e;margin:0 0 8px 0;">Hi ${displayName},</p>
                <p style="color:#6b6860;margin:0 0 32px 0;">Your booking for <strong style="color:#12100e;">${eventTitle}</strong> is confirmed.</p>

                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;border-radius:12px;padding:24px;margin-bottom:32px;">
                  <tr>
                    <td style="padding:8px 0;color:#6b6860;font-size:0.875rem;">Ticket Code</td>
                    <td style="padding:8px 0;text-align:right;">
                      <span style="font-family:monospace;background:#ede9ff;color:#6c47ff;padding:6px 14px;border-radius:8px;font-weight:700;letter-spacing:0.12em;font-size:0.9rem;">${ticketCode}</span>
                    </td>
                  </tr>
                  <tr><td colspan="2" style="height:1px;background:rgba(0,0,0,0.07);padding:0;"></td></tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b6860;font-size:0.875rem;">Tickets</td>
                    <td style="padding:8px 0;text-align:right;font-weight:500;">${ticketCount} ${ticketPlural}</td>
                  </tr>
                  <tr><td colspan="2" style="height:1px;background:rgba(0,0,0,0.07);padding:0;"></td></tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b6860;font-size:0.875rem;">Total paid</td>
                    <td style="padding:8px 0;text-align:right;font-weight:700;color:#6c47ff;">${priceDisplay}</td>
                  </tr>
                </table>

                <p style="color:#6b6860;font-size:0.875rem;margin:0;">Present your ticket code at the venue. You can also view your QR code in the app under <strong>My Tickets</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;border-top:1px solid rgba(0,0,0,0.07);text-align:center;color:#a8a6a0;font-size:0.78rem;">
                APEX Events · This is an automated confirmation email
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `Your booking for ${eventTitle} is confirmed`,
        html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Resend API error:', JSON.stringify(errorData))
      console.error(`  from: ${fromEmail}  →  to: ${to}`)
      return res.status(500).json({
        error: errorData.message || 'Email send failed',
        name: errorData.name,
        statusCode: response.status,
        hint: response.status === 403
          ? 'Domain not verified in Resend. Go to resend.com/domains and add DNS records for your sending domain.'
          : response.status === 422
          ? 'Invalid from address — make sure RESEND_FROM_EMAIL is a verified sender domain in Resend.'
          : undefined,
      })
    }

    console.log(`Email sent to ${to} for "${eventTitle}"`)
    return res.json({ ok: true })
  } catch (error) {
    console.error('Email send error:', error.message)
    return res.status(500).json({ error: error.message })
  }
})

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Stripe server running on http://localhost:${port}`)
  })
}

export default app;
