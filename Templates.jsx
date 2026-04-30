import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutTemplate } from 'lucide-react'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

export default function Templates({ profile }) {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    try {
      setTemplates(JSON.parse(localStorage.getItem('event_templates') || '[]'))
    } catch {
      setTemplates([])
    }
  }, [])

  const handleLoad = (template) => {
    localStorage.setItem('event_load', JSON.stringify(template.form))
    toast.success('Template loaded — opening Create Event')
    navigate('/create-event')
  }

  const handleDelete = (id) => {
    const next = templates.filter((t) => t.id !== id)
    localStorage.setItem('event_templates', JSON.stringify(next))
    setTemplates(next)
    toast.success('Template deleted')
  }

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <div>
          <h1>Templates</h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.35rem' }}>
            Reusable event blueprints saved locally. Load one to pre-fill the Create Event form.
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"><LayoutTemplate size={36} /></div>
          <h3>No templates yet</h3>
          <p>Use the "Save Template" button on the Create Event page to save a reusable event structure.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Saved templates ({templates.length})</h3>
          </div>
          <div className="list-card">
            {templates.map((template) => (
              <div key={template.id} className="list-row">
                <div className="list-row-info">
                  <strong>{template.name || template.form.title || 'Untitled template'}</strong>
                  <span>
                    {template.form.event_type || 'No type'}
                    {template.form.is_free ? ' · Free' : template.form.price ? ` · £${template.form.price}` : ''}
                    {template.form.tickets_total ? ` · ${template.form.tickets_total} tickets` : ''}
                  </span>
                </div>
                <div className="list-row-actions">
                  <button className="btn-accent" onClick={() => handleLoad(template)}>Load</button>
                  <button className="btn-outline" onClick={() => handleDelete(template.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
