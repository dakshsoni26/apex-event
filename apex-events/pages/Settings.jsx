import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import NotificationPreferences from '../components/NotificationPreferences'
import toast from 'react-hot-toast'

export default function Settings({ session, profile }) {
  const navigate = useNavigate()
  const storageKey = `apex:settings:${session?.user?.id || 'anon'}`
  const [form, setForm] = useState({
    full_name: '',
    role: 'guest',
    timezone: 'UTC',
    language: 'en-GB',
    date_format: 'DD/MM/YYYY',
    company_name: '',
    company_website: '',
    support_email: '',
    brand_color: '#FF6B35',
  })
  const [notifications, setNotifications] = useState({
    email_ticket_updates: true,
    email_event_reminders: true,
    email_marketing: false,
    push_new_bookings: true,
    push_event_reminders: true,
  })
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentForm, setPaymentForm] = useState({ cardLabel: '', cardNumber: '4242 4242 4242 4242', expiry: '04/30', cvc: '123' })
  const [saving, setSaving] = useState(false)
  const [addingCard, setAddingCard] = useState(false)

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem(storageKey) || '{}')
    setForm({
      full_name: profile?.full_name || '',
      role: profile?.role || 'guest',
      timezone: savedSettings.timezone || 'UTC',
      language: savedSettings.language || 'en-GB',
      date_format: savedSettings.date_format || 'DD/MM/YYYY',
      company_name: savedSettings.company_name || '',
      company_website: savedSettings.company_website || '',
      support_email: savedSettings.support_email || session?.user?.email || '',
      brand_color: savedSettings.brand_color || '#FF6B35',
      ticket_logo: savedSettings.ticket_logo || '',
      ticket_message: savedSettings.ticket_message || 'Your ticket is valid for entry only. Please bring a photo ID.',
    })
    setNotifications({
      email_ticket_updates: savedSettings.notifications?.email_ticket_updates ?? true,
      email_event_reminders: savedSettings.notifications?.email_event_reminders ?? true,
      email_marketing: savedSettings.notifications?.email_marketing ?? false,
      push_new_bookings: savedSettings.notifications?.push_new_bookings ?? true,
      push_event_reminders: savedSettings.notifications?.push_event_reminders ?? true,
    })
    setPaymentMethods(savedSettings.payment_methods || [])
  }, [profile, session?.user?.email, storageKey])

  const persistSettings = (nextState) => {
    localStorage.setItem(storageKey, JSON.stringify(nextState))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({ id: session.user.id, full_name: form.full_name, role: form.role })
    if (error) {
      toast.error(error.message)
    } else {
      persistSettings({
        timezone: form.timezone,
        language: form.language,
        date_format: form.date_format,
        company_name: form.company_name,
        company_website: form.company_website,
        support_email: form.support_email,
        brand_color: form.brand_color,
        ticket_logo: form.ticket_logo,
        ticket_message: form.ticket_message,
        notifications,
        payment_methods: paymentMethods,
      })
      toast.success('Settings saved')
    }
    setSaving(false)
  }

  const handlePasswordReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: `${window.location.origin}/signin`,
    })
    if (error) toast.error(error.message)
    else toast.success('Password reset email sent')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  const toggleNotification = (key) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }))
  }

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault()
    setAddingCard(true)
    const nextPaymentMethods = [
      ...paymentMethods,
      {
        id: crypto.randomUUID(),
        label: paymentForm.cardLabel || 'Stripe test card',
        brand: 'Visa',
        last4: paymentForm.cardNumber.replace(/\s+/g, '').slice(-4),
        expiry: paymentForm.expiry,
        primary: paymentMethods.length === 0,
      },
    ]
    setPaymentMethods(nextPaymentMethods)
    persistSettings({
      timezone: form.timezone,
      language: form.language,
      date_format: form.date_format,
      company_name: form.company_name,
      company_website: form.company_website,
      support_email: form.support_email,
      brand_color: form.brand_color,
      notifications,
      payment_methods: nextPaymentMethods,
    })
    setPaymentForm({ cardLabel: '', cardNumber: '4242 4242 4242 4242', expiry: '04/30', cvc: '123' })
    toast.success('Payment method saved')
    setAddingCard(false)
  }

  const setPrimaryCard = (cardId) => {
    const nextPaymentMethods = paymentMethods.map((card) => ({ ...card, primary: card.id === cardId }))
    setPaymentMethods(nextPaymentMethods)
    persistSettings({
      timezone: form.timezone,
      language: form.language,
      date_format: form.date_format,
      company_name: form.company_name,
      company_website: form.company_website,
      support_email: form.support_email,
      brand_color: form.brand_color,
      notifications,
      payment_methods: nextPaymentMethods,
    })
    toast.success('Primary payment method updated')
  }

  const removeCard = (cardId) => {
    const nextPaymentMethods = paymentMethods.filter((card) => card.id !== cardId)
    setPaymentMethods(nextPaymentMethods)
    persistSettings({
      timezone: form.timezone,
      language: form.language,
      date_format: form.date_format,
      company_name: form.company_name,
      company_website: form.company_website,
      support_email: form.support_email,
      brand_color: form.brand_color,
      notifications,
      payment_methods: nextPaymentMethods,
    })
    toast.success('Payment method removed')
  }

  return (
    <Layout profile={profile}>
      <div className="settings-shell">
        <div className="page-header">
          <div>
            <h1>Settings</h1>
            <p style={{ color: 'var(--text2)', marginTop: '0.35rem' }}>Account, company, notifications, payments, and security.</p>
          </div>
          <div className="settings-actions">
            <button className="btn-outline" type="button" onClick={handlePasswordReset}>Reset password</button>
            <button className="btn-accent" type="button" onClick={handleLogout}>Log out</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="settings-grid">
          <div className="settings-main">
            <section className="form-card settings-section">
              <h2>Account</h2>
              <div className="form-row">
                <div className="form-field">
                  <label>Full name</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="guest">Guest</option>
                    <option value="host">Host</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Timezone</label>
                  <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                    <option value="UTC">UTC</option>
                    <option value="GMT">GMT</option>
                    <option value="EST">EST</option>
                    <option value="WAT">WAT</option>
                    <option value="PST">PST</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Date format</label>
                  <select value={form.date_format} onChange={(e) => setForm({ ...form, date_format: e.target.value })}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </section>

            {form.role === 'host' && (
              <section className="form-card settings-section">
                <h2>Company</h2>
                <div className="form-row">
                  <div className="form-field">
                    <label>Company name</label>
                    <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="APEX Events Ltd" />
                  </div>
                  <div className="form-field">
                    <label>Website</label>
                    <input value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} placeholder="https://yourcompany.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Support email</label>
                    <input value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} placeholder="support@yourcompany.com" />
                  </div>
                  <div className="form-field">
                    <label>Brand color</label>
                    <input type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} style={{ padding: 0, height: '46px' }} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Ticket logo (image URL)</label>
                    <input value={form.ticket_logo || ''} onChange={(e) => setForm({ ...form, ticket_logo: e.target.value })} placeholder="https://.../logo.png" />
                  </div>
                  <div className="form-field">
                    <label>Ticket message</label>
                    <input value={form.ticket_message || ''} onChange={(e) => setForm({ ...form, ticket_message: e.target.value })} placeholder="Ticket message shown on printed tickets" />
                  </div>
                </div>
                <div className="settings-note">Company settings are stored locally for now, so you can shape the host experience immediately.</div>
              </section>
            )}

            <section className="form-card settings-section">
              <h2>Notifications</h2>
              <div className="settings-list">
                {[
                  { key: 'email_ticket_updates', label: 'Ticket updates', desc: 'New bookings, cancellations, and ticket changes.' },
                  { key: 'email_event_reminders', label: 'Event reminders', desc: 'Send reminders before the event starts.' },
                  { key: 'email_marketing', label: 'Marketing emails', desc: 'Product updates and feature announcements.' },
                  { key: 'push_new_bookings', label: 'New booking alerts', desc: 'Instant alerts when someone books.' },
                  { key: 'push_event_reminders', label: 'Reminder push alerts', desc: 'Notify guests and hosts before events.' },
                ].map((item) => (
                  <div className="setting-row" key={item.key}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.desc}</span>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={notifications[item.key]} onChange={() => toggleNotification(item.key)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <section className="form-card settings-section">
              <h2>Payment methods</h2>
              <form onSubmit={handleAddPaymentMethod} className="payment-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Card label</label>
                    <input value={paymentForm.cardLabel} onChange={(e) => setPaymentForm({ ...paymentForm, cardLabel: e.target.value })} placeholder="Stripe test card" />
                  </div>
                  <div className="form-field">
                    <label>Card number</label>
                    <input value={paymentForm.cardNumber} onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })} placeholder="4242 4242 4242 4242" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Expiry</label>
                    <input value={paymentForm.expiry} onChange={(e) => setPaymentForm({ ...paymentForm, expiry: e.target.value })} placeholder="04/30" />
                  </div>
                  <div className="form-field">
                    <label>CVC</label>
                    <input value={paymentForm.cvc} onChange={(e) => setPaymentForm({ ...paymentForm, cvc: e.target.value })} placeholder="123" />
                  </div>
                </div>
                <button className="btn-accent" type="submit" disabled={addingCard}>{addingCard ? 'Saving...' : 'Add payment method'}</button>
              </form>

              <div className="payment-cards">
                {paymentMethods.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                    <h3>No payment methods yet</h3>
                    <p>Add a Stripe test card to simulate guest bookings.</p>
                  </div>
                ) : paymentMethods.map((card) => (
                  <div className="payment-card" key={card.id}>
                    <div>
                      <strong>{card.label}</strong>
                      <span>{card.brand} ending {card.last4} · Expires {card.expiry}</span>
                    </div>
                    <div className="payment-card-actions">
                      {card.primary ? <span className="payment-badge">Primary</span> : <button type="button" className="btn-outline" onClick={() => setPrimaryCard(card.id)}>Set primary</button>}
                      <button type="button" className="btn-outline" onClick={() => removeCard(card.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <NotificationPreferences 
              notifications={notifications}
              onNotificationChange={(key, value) => setNotifications({ ...notifications, [key]: value })}
            />
          </div>

          <aside className="settings-sidebar">
            <div className="form-card settings-section">
              <h2>Quick summary</h2>
              <div className="settings-summary-item"><span>Email</span><strong>{session?.user?.email}</strong></div>
              <div className="settings-summary-item"><span>Role</span><strong>{form.role}</strong></div>
              <div className="settings-summary-item"><span>Notifications</span><strong>{Object.values(notifications).filter(Boolean).length} on</strong></div>
              <div className="settings-summary-item"><span>Cards</span><strong>{paymentMethods.length}</strong></div>
            </div>
            <div className="form-card settings-section">
              <h2>Host tools</h2>
              <ul className="feature-list">
                <li><strong>Drafts</strong> — save event form progress</li>
                <li><strong>Templates</strong> — reuse event structures</li>
                <li><strong>Team</strong> — manage co-organisers</li>
                <li><strong>Webhooks</strong> — inspect Stripe events</li>
                <li><strong>Ticket branding</strong> — customise below</li>
              </ul>
            </div>
          </aside>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save all settings'}</button>
            <button className="btn-outline" type="button" onClick={() => navigate('/home')}>Back to dashboard</button>
          </div>
        </form>
      </div>
    </Layout>
  )
}