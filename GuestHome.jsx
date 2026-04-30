import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, MapPin, Search } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import EventFilters from '../components/EventFilters'
import { useEventSearch } from '../hooks/useEventSearch'
import { bannerClass } from '../utils/events'

const CATEGORIES = ['All', 'Music', 'Sports', 'Fashion', 'Technology', 'Conference', 'Social']
const PAGE_SIZE = 12

export default function GuestHome({ session, profile }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  // New filter states
  const [filters, setFilters] = useState({
    priceRange: null,
    dateRange: null,
    location: '',
  })
  const [sortBy, setSortBy] = useState('newest')

  const [myBookings, setMyBookings] = useState([])
  const [ticketsSoldMap, setTicketsSoldMap] = useState({})
  const [savedEventIds, setSavedEventIds] = useState([])

  const { applyFilters, getActiveFilterCount } = useEventSearch()

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Load bookings, saved events, and ticket counts once on mount
  useEffect(() => {
    const loadUserData = async () => {
      const [{ data: bookingsData }, { data: rsvpCounts }, { data: savedData }] = await Promise.all([
        supabase.from('rsvps').select('event_id').eq('guest_id', session.user.id),
        supabase.from('rsvps').select('event_id, ticket_count'),
        supabase.from('saved_events').select('event_id').eq('user_id', session.user.id),
      ])

      const soldMap = {}
      for (const r of rsvpCounts || []) {
        soldMap[r.event_id] = (soldMap[r.event_id] || 0) + (r.ticket_count || 1)
      }

      setMyBookings(bookingsData?.map((b) => b.event_id) || [])
      setTicketsSoldMap(soldMap)
      setSavedEventIds(savedData?.map((s) => s.event_id) || [])
    }
    loadUserData()
  }, [session.user.id])

  const fetchEvents = useCallback(async ({ search: q, category, pageNum, append }) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    let query = supabase
      .from('events')
      .select('id, title, description, event_type, start_date, location, virtual_link, is_free, price, tickets_total', { count: 'exact' })
      .order('start_date', { ascending: true })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (category !== 'All') {
      query = query.ilike('event_type', category)
    }
    if (q) {
      query = query.ilike('title', `%${q}%`)
    }

    const { data, count } = await query

    if (append) {
      setEvents((prev) => [...prev, ...(data || [])])
    } else {
      setEvents(data || [])
    }
    setHasMore((pageNum + 1) * PAGE_SIZE < (count || 0))
    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Reset and reload when filters change
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      fetchEvents({ search: debouncedSearch, category: activeCategory, pageNum: 0, append: false })
      return
    }
    setPage(0)
    fetchEvents({ search: debouncedSearch, category: activeCategory, pageNum: 0, append: false })
  }, [debouncedSearch, activeCategory, fetchEvents])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchEvents({ search: debouncedSearch, category: activeCategory, pageNum: next, append: true })
  }

  // Apply client-side filters and sorting
  const displayedEvents = applyFilters(events, filters, sortBy)
  const activeFilterCount = getActiveFilterCount(filters)

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
  }

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <div>
          <h1>Discover events</h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.35rem' }}>
            Browse what is happening next and save what you want to revisit.
          </p>
        </div>
        <Link to="/my-tickets" className="btn-outline">My Tickets</Link>
      </div>

      <div className="search-bar">
        <Search size={18} style={{ color: 'var(--text3)' }} aria-hidden="true" />
        <input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search events by title"
        />
      </div>

      <div className="categories-row" role="region" aria-label="Event categories">
        {CATEGORIES.map((category) => (
          <span
            key={category}
            className={`tag ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setActiveCategory(category)
              }
            }}
            aria-pressed={activeCategory === category}
            aria-label={`Filter by ${category} category`}
          >
            {category}
          </span>
        ))}
      </div>

      {/* Event Filters & Sort Component */}
      <EventFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        sortBy={sortBy}
        activeFiltersCount={activeFilterCount}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loader" style={{ margin: '0 auto' }} />
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"><Search size={36} /></div>
          <h3>No events found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <div className="events-grid">
            {displayedEvents.map((event) => {
              const totalTickets = event.tickets_total || 100
              const sold = ticketsSoldMap[event.id] || 0
              const left = Math.max(0, totalTickets - sold)
              const booked = myBookings.includes(event.id)
              const saved = savedEventIds.includes(event.id)

              return (
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
                    <div className="event-card-footer">
                      <span className={`tickets-left ${left < 10 ? 'low' : ''}`}>
                        {left > 0 ? `${left} left` : 'Sold out'}
                      </span>
                      <span className="event-card-status">
                        {booked && <span className="status-badge booked">Booked</span>}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button
                className="btn-outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="loader" style={{ width: '14px', height: '14px', marginRight: '0.5rem' }} />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
