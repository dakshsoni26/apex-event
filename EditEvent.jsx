import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import { EVENT_TYPES } from '../utils/events'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  title: '',
  event_type: '',
  description: '',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  location: '',
  virtual_link: '',
  capacity: '',
  tickets_total: '',
  is_free: true,
  price: '',
}

function toDatePart(isoString) {
  if (!isoString) return ''
  return isoString.slice(0, 10)
}

function toTimePart(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function EditEvent({ session, profile }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    const fetchEvent = async () => {
      const { data: event } = await supabase.from('events').select('*').eq('id', id).single()

      if (!event) { setNotFound(true); setLoading(false); return }
      if (event.host_id !== session.user.id) { setNotFound(true); setLoading(false); return }

      setForm({
        title: event.title || '',
        event_type: event.event_type || '',
        description: event.description || '',
        start_date: toDatePart(event.start_date),
        start_time: toTimePart(event.start_date),
        end_date: toDatePart(event.end_date),
        end_time: toTimePart(event.end_date),
        location: event.location || '',
        virtual_link: event.virtual_link || '',
        capacity: event.capacity != null ? String(event.capacity) : '',
        tickets_total: event.tickets_total != null ? String(event.tickets_total) : '',
        is_free: event.is_free ?? true,
        price: event.price ? String(event.price) : '',
      })
      setLoading(false)
    }

    fetchEvent()
  }, [id, session.user.id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Event name is required'); return }

    setSaving(true)

    const startDT = form.start_date
      ? form.start_time ? `${form.start_date}T${form.start_time}` : form.start_date
      : null
    const endDT = form.end_date
      ? form.end_time ? `${form.end_date}T${form.end_time}` : form.end_date
      : null

    const { error } = await supabase.from('events').update({
      title: form.title.trim(),
      event_type: form.event_type || null,
      description: form.description || null,
      start_date: startDT,
      end_date: endDT,
      location: form.location || null,
      virtual_link: form.virtual_link || null,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      tickets_total: form.tickets_total ? parseInt(form.tickets_total, 10) : null,
      is_free: form.is_free,
      price: form.is_free ? 0 : form.price ? parseFloat(form.price) : 0,
    }).eq('id', id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Event updated')
      navigate(`/events/${id}`)
    }
    setSaving(false)
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

  if (notFound) {
    return (
      <Layout profile={profile}>
        <div className="empty-state card">
          <h3>Event not found</h3>
          <p>This event does not exist or you do not have permission to edit it.</p>
          <button className="btn-accent" type="button" onClick={() => navigate('/home')}>
            Back to Dashboard
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout profile={profile}>
      <div className="form-page">
        <h1>Edit Event</h1>
        <p>Update the details below. Changes are saved immediately.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-card">
            <h2>Event Details</h2>
            <div className="form-field">
              <label>Event Name *</label>
              <input name="title" placeholder="Event name" value={form.title} onChange={handleChange} required />
            </div>
            <div className="form-field">
              <label>Event Type</label>
              <select name="event_type" value={form.event_type} onChange={handleChange}>
                <option value="">Select type...</option>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Description</label>
              <textarea name="description" placeholder="Describe the event" value={form.description} onChange={handleChange} />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Maximum Capacity</label>
                <input type="number" name="capacity" placeholder="e.g. 100" value={form.capacity} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Tickets Available</label>
                <input type="number" name="tickets_total" placeholder="e.g. 100" value={form.tickets_total} onChange={handleChange} />
              </div>
            </div>
            <div className="toggle-row">
              <span style={{ fontSize: '0.9rem' }}>Free event</span>
              <label className="toggle">
                <input type="checkbox" name="is_free" checked={form.is_free} onChange={handleChange} />
                <span className="toggle-slider" />
              </label>
            </div>
            {!form.is_free && (
              <div className="form-field">
                <label>Ticket Price (£)</label>
                <input type="number" step="0.01" name="price" placeholder="e.g. 25" value={form.price} onChange={handleChange} />
              </div>
            )}
          </div>

          <div className="form-card">
            <h2>Date & Time</h2>
            <div className="form-row">
              <div className="form-field">
                <label>Start Date</label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Start Time</label>
                <input type="time" name="start_time" value={form.start_time} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>End Date</label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>End Time</label>
                <input type="time" name="end_time" value={form.end_time} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-card">
            <h2>Location</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: '1rem' }}>Fill in the one that applies.</p>
            <div className="form-field">
              <label>Physical Address</label>
              <input name="location" placeholder="Enter physical address" value={form.location} onChange={handleChange} />
            </div>
            <div className="or-divider">Or</div>
            <div className="form-field">
              <label>Virtual Link</label>
              <input name="virtual_link" placeholder="Zoom / Google Meet link" value={form.virtual_link} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate(`/events/${id}`)}
              style={{ flex: 1, padding: '0.9rem', border: '1.5px solid var(--border)', borderRadius: '8px', background: 'white', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem' }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2, borderRadius: '8px', margin: 0 }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
