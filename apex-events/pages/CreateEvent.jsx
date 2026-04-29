import { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import { EVENT_TYPES } from '../utils/events'
import toast from 'react-hot-toast'

export default function CreateEvent({ session, profile }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [allDay, setAllDay] = useState(false)
  const [form, setForm] = useState({
    title: '',
    event_type: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    timezone: 'UTC',
    location: '',
    virtual_link: '',
    capacity: '',
    tickets_total: '',
    is_free: true,
    price: '',
  })
  const [drafts, setDrafts] = useState([])
  const [templates, setTemplates] = useState([])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const startDT = allDay ? form.start_date : `${form.start_date}T${form.start_time}`
    const endDT = allDay ? form.end_date : `${form.end_date}T${form.end_time}`

    const { data, error } = await supabase.from('events').insert({
      host_id: session.user.id,
      title: form.title,
      event_type: form.event_type,
      description: form.description,
      start_date: startDT || null,
      end_date: endDT || null,
      location: form.location || null,
      virtual_link: form.virtual_link || null,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      tickets_total: form.tickets_total ? parseInt(form.tickets_total, 10) : null,
      is_free: form.is_free,
      price: form.is_free ? 0 : form.price ? parseFloat(form.price) : 0,
    }).select().single()

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Event created!')
      navigate(`/events/${data.id}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    try {
      const ds = JSON.parse(localStorage.getItem('event_drafts') || '[]')
      const ts = JSON.parse(localStorage.getItem('event_templates') || '[]')
      setDrafts(ds)
      setTemplates(ts)
      // load any copied draft/template
      const load = JSON.parse(localStorage.getItem('event_load') || 'null')
      if (load) {
        setForm(load)
        localStorage.removeItem('event_load')
        toast.success('Loaded draft/template into form')
      }
    } catch (err) {
      // ignore
    }
  }, [])

  const saveDraft = () => {
    const draft = { id: Date.now(), savedAt: new Date().toISOString(), form }
    const ds = [draft, ...drafts].slice(0, 20)
    localStorage.setItem('event_drafts', JSON.stringify(ds))
    setDrafts(ds)
    toast.success('Draft saved locally')
  }

  const loadDraft = (id) => {
    const d = drafts.find((x) => x.id === Number(id))
    if (d) {
      setForm(d.form)
      toast.success('Draft loaded')
    }
  }

  const deleteDraft = (id) => {
    const ds = drafts.filter((x) => x.id !== Number(id))
    localStorage.setItem('event_drafts', JSON.stringify(ds))
    setDrafts(ds)
  }

  const saveTemplate = () => {
    const tmpl = { id: Date.now(), name: form.title || `Template ${new Date().toLocaleString()}`, form }
    const ts = [tmpl, ...templates].slice(0, 20)
    localStorage.setItem('event_templates', JSON.stringify(ts))
    setTemplates(ts)
    toast.success('Template saved locally')
  }

  const loadTemplate = (id) => {
    const t = templates.find((x) => x.id === Number(id))
    if (t) {
      setForm(t.form)
      toast.success('Template loaded')
    }
  }

  const deleteTemplate = (id) => {
    const ts = templates.filter((x) => x.id !== Number(id))
    localStorage.setItem('event_templates', JSON.stringify(ts))
    setTemplates(ts)
  }

  return (
    <Layout profile={profile}>
      <div className="form-page">
        <h1>Create Event</h1>
        <p>Fill in the details below to create a new event.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-card">
            <h2>Event Details</h2>
            <div className="form-field"><label>Event Name *</label><input name="title" placeholder="Input the event name" value={form.title} onChange={handleChange} required /></div>
            <div className="form-field">
              <label>Event Type</label>
              <select name="event_type" value={form.event_type} onChange={handleChange}>
                <option value="">Select type...</option>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field"><label>Event Description</label><textarea name="description" placeholder="Write a short description of the event" value={form.description} onChange={handleChange} /></div>
            <div className="form-row">
              <div className="form-field"><label>Maximum Capacity</label><input type="number" name="capacity" placeholder="e.g. 100" value={form.capacity} onChange={handleChange} /></div>
              <div className="form-field"><label>Tickets Available</label><input type="number" name="tickets_total" placeholder="e.g. 100" value={form.tickets_total} onChange={handleChange} /></div>
            </div>
            <div className="toggle-row">
              <span style={{ fontSize: '0.9rem' }}>Free event</span>
              <label className="toggle">
                <input type="checkbox" name="is_free" checked={form.is_free} onChange={handleChange} />
                <span className="toggle-slider" />
              </label>
            </div>
            {!form.is_free && (
              <div className="form-field"><label>Ticket Price</label><input type="number" step="0.01" name="price" placeholder="e.g. 25" value={form.price} onChange={handleChange} /></div>
            )}
          </div>

          <div className="form-card">
            <h2>Date & Time</h2>
            <div className="toggle-row">
              <span style={{ fontSize: '0.9rem' }}>All Day</span>
              <label className="toggle">
                <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-field"><label>Start Date</label><input type="date" name="start_date" value={form.start_date} onChange={handleChange} /></div>
              {!allDay && <div className="form-field"><label>Start Time</label><input type="time" name="start_time" value={form.start_time} onChange={handleChange} /></div>}
              <div className="form-field"><label>End Date</label><input type="date" name="end_date" value={form.end_date} onChange={handleChange} /></div>
              {!allDay && <div className="form-field"><label>End Time</label><input type="time" name="end_time" value={form.end_time} onChange={handleChange} /></div>}
            </div>
            <div className="form-field">
              <label>Time Zone</label>
              <select name="timezone" value={form.timezone} onChange={handleChange}>
                <option value="UTC">UTC</option><option value="GMT">GMT (London)</option><option value="EST">EST</option><option value="WAT">WAT</option><option value="PST">PST</option>
              </select>
            </div>
          </div>

          <div className="form-card">
            <h2>Location</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: '1rem' }}>Fill in the one that applies to you.</p>
            <div className="form-field"><label>Physical Address</label><input name="location" placeholder="Enter physical address" value={form.location} onChange={handleChange} /></div>
            <div className="or-divider">Or</div>
            <div className="form-field"><label>Virtual Link</label><input name="virtual_link" placeholder="Enter virtual link (Zoom/Google Meet)" value={form.virtual_link} onChange={handleChange} /></div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                <select onChange={(e) => loadDraft(e.target.value)} value="" style={{ flex: 1 }}>
                  <option value="">Load draft...</option>
                  {drafts.map((d) => <option key={d.id} value={d.id}>{d.form.title || `Draft ${new Date(d.savedAt).toLocaleString()}`}</option>)}
                </select>
                <button type="button" onClick={saveDraft} style={{ padding: '0.6rem 0.8rem' }}>Save Draft</button>
                <button type="button" onClick={() => { if (drafts[0]) loadDraft(drafts[0].id) }} style={{ padding: '0.6rem 0.8rem' }}>Load Latest</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                <select onChange={(e) => loadTemplate(e.target.value)} value="" style={{ flex: 1 }}>
                  <option value="">Load template...</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button type="button" onClick={saveTemplate} style={{ padding: '0.6rem 0.8rem' }}>Save Template</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => navigate('/home')} style={{ flex: 1, padding: '0.9rem', border: '1.5px solid var(--border)', borderRadius: '8px', background: 'white', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, borderRadius: '8px', margin: 0 }} disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}