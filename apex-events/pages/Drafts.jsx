import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

export default function Drafts({ profile }) {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState([])

  useEffect(() => {
    try {
      setDrafts(JSON.parse(localStorage.getItem('event_drafts') || '[]'))
    } catch {
      setDrafts([])
    }
  }, [])

  const handleLoad = (draft) => {
    localStorage.setItem('event_load', JSON.stringify(draft.form))
    toast.success('Draft loaded — opening Create Event')
    navigate('/create-event')
  }

  const handleDelete = (id) => {
    const next = drafts.filter((d) => d.id !== id)
    localStorage.setItem('event_drafts', JSON.stringify(next))
    setDrafts(next)
    toast.success('Draft deleted')
  }

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <div>
          <h1>Drafts</h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.35rem' }}>
            Drafts are saved locally in this browser. Load one to continue editing in Create Event.
          </p>
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"><FileText size={36} /></div>
          <h3>No drafts yet</h3>
          <p>Use the "Save Draft" button on the Create Event page to save your progress.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Saved drafts ({drafts.length})</h3>
          </div>
          <div className="list-card">
            {drafts.map((draft) => (
              <div key={draft.id} className="list-row">
                <div className="list-row-info">
                  <strong>{draft.form.title || 'Untitled draft'}</strong>
                  <span>
                    {draft.form.event_type || 'No type'} &middot; Saved {new Date(draft.savedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="list-row-actions">
                  <button className="btn-accent" onClick={() => handleLoad(draft)}>Load</button>
                  <button className="btn-outline" onClick={() => handleDelete(draft.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
