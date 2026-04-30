import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Heart, MapPin } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import { bannerClass } from '../utils/events'

export default function SavedEvents({ session, profile }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSaved = async () => {
      const { data } = await supabase
        .from('saved_events')
        .select('event_id, events(id, title, description, event_type, start_date, location, is_free, price)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setEvents((data || []).map((row) => row.events).filter(Boolean))
      setLoading(false)
    }

    fetchSaved()
  }, [session.user.id])

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <h1>Saved Events</h1>
        <Link to="/home" className="btn-outline">Back to discover</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loader" style={{ margin: '0 auto' }} />
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"><Heart size={36} /></div>
          <h3>No saved events yet</h3>
          <p>Use the save button on any event to keep it here for later.</p>
          <Link to="/home" className="btn-accent">Discover events</Link>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="event-card">
              <div className={`event-card-banner ${bannerClass(event.event_type)}`}>
                <span className="event-type-badge">{event.event_type || 'Event'}</span>
                <span className={`event-price-tag ${event.is_free ? 'free' : ''}`}>
                  {event.is_free ? 'Free' : `£${event.price || 0}`}
                </span>
              </div>
              <div className="event-card-body">
                <h3>{event.title}</h3>
                <p>{event.description || 'No description added yet.'}</p>
                <div className="event-meta">
                  {event.start_date && (
                    <div className="event-meta-row">
                      <CalendarDays size={16} />
                      {new Date(event.start_date).toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  )}
                  {event.location && (
                    <div className="event-meta-row">
                      <MapPin size={16} /> {event.location}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}
