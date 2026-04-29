import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'

export default function Calendar({ session, profile }) {
  const [events, setEvents] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('id, title, start_date').eq('host_id', session.user.id)
      setEvents(data || [])
    }
    fetchEvents()
  }, [session])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const today = new Date()

  const eventsByDate = {}
  events.forEach((event) => {
    if (event.start_date) {
      const key = new Date(event.start_date).toDateString()
      if (!eventsByDate[key]) eventsByDate[key] = []
      eventsByDate[key].push(event)
    }
  })

  const days = []
  for (let i = firstDay - 1; i >= 0; i -= 1) days.push({ day: daysInPrevMonth - i, current: false })
  for (let i = 1; i <= daysInMonth; i += 1) days.push({ day: i, current: true })
  for (let i = 1; days.length < 42; i += 1) days.push({ day: i, current: false })

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '2rem' }}>{monthNames[month].toUpperCase()} {year}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setCurrentDate(new Date(year, month - 1))} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.9rem' }}>‹</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1))} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.9rem' }}>›</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="calendar-grid" style={{ marginBottom: '0.5rem' }}>{dayNames.map((day) => <div key={day} className="cal-header">{day}</div>)}</div>
        <div className="calendar-grid">
          {days.map((day, index) => {
            const dateObj = new Date(year, day.current ? month : (index < firstDay ? month - 1 : month + 1), day.day)
            const dateKey = dateObj.toDateString()
            const dayEvents = eventsByDate[dateKey] || []
            const isToday = dateObj.toDateString() === today.toDateString()

            return (
              <div key={`${day.day}-${index}`} className={`cal-day ${isToday ? 'today' : ''} ${!day.current ? 'other-month' : ''}`}>
                <div className="cal-day-num">{day.day}</div>
                {dayEvents.map((event) => (
                  <div key={event.id} className="cal-event-dot" title={event.title} onClick={() => navigate(`/events/${event.id}`)} style={{ cursor: 'pointer' }} />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}