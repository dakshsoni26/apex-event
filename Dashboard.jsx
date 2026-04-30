import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ClipboardList, PoundSterling, Ticket } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import { formatMoney } from '../utils/events'

export default function Dashboard({ session, profile }) {
  const [stats, setStats] = useState({ events: 0, rsvps: 0, upcoming: 0, earnings: 0 })
  const [recentEvents, setRecentEvents] = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: hostEvents } = await supabase
        .from('events')
        .select('id, title, event_type, start_date, created_at')
        .eq('host_id', session.user.id)
        .order('created_at', { ascending: false })

      const hostEventIds = (hostEvents || []).map((e) => e.id)

      let hostRsvps = []
      if (hostEventIds.length > 0) {
        const { data } = await supabase
          .from('rsvps')
          .select('id, event_id, total_paid')
          .in('event_id', hostEventIds)
        hostRsvps = data || []
      }

      const upcomingCount = (hostEvents || []).filter(
        (e) => e.start_date && new Date(e.start_date) >= new Date()
      ).length
      const earnings = hostRsvps.reduce((sum, r) => sum + (Number(r.total_paid) || 0), 0)

      const counts = {}
      for (const e of hostEvents || []) {
        const type = e.event_type || 'Other'
        counts[type] = (counts[type] || 0) + 1
      }
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      const maxCount = sorted[0]?.[1] || 1

      setStats({ events: hostEvents?.length || 0, rsvps: hostRsvps.length, upcoming: upcomingCount, earnings })
      setRecentEvents((hostEvents || []).slice(0, 5))
      setCategoryBreakdown(sorted.map(([label, count]) => ({ label, count, pct: Math.round((count / maxCount) * 100) })))
      setLoading(false)
    }

    fetchData()
  }, [session])

  return (
    <Layout profile={profile}>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><CalendarDays size={24} /></div>
          <div><h3>Upcoming Events</h3><div className="stat-value">{stats.upcoming}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ClipboardList size={24} /></div>
          <div><h3>My Events</h3><div className="stat-value">{stats.events}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Ticket size={24} /></div>
          <div><h3>Total RSVPs</h3><div className="stat-value">{stats.rsvps}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><PoundSterling size={24} /></div>
          <div><h3>Total Earnings</h3><div className="stat-value">{formatMoney(stats.earnings)}</div></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Events</h3>
            <Link to="/create-event" className="btn-accent" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
              + New Event
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)' }}>Loading...</div>
          ) : recentEvents.length === 0 ? (
            <div className="empty-state">
              <h3>No events yet</h3>
              <p>Create your first event to get started</p>
              <Link to="/create-event" className="btn-accent" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                Create Event
              </Link>
            </div>
          ) : (
            <div>
              {recentEvents.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{event.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                        {event.start_date ? new Date(event.start_date).toLocaleDateString('en-GB') : 'No date set'}
                      </div>
                    </div>
                    <span className="event-type-badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      {event.event_type || 'Event'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Events by Category</h3></div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)' }}>Loading...</div>
          ) : categoryBreakdown.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p>No events created yet</p>
            </div>
          ) : (
            categoryBreakdown.map(({ label, count, pct }) => (
              <div className="bar-row" key={label}>
                <div className="bar-label">
                  <span>{label}</span>
                  <span>{count} {count === 1 ? 'event' : 'events'}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
