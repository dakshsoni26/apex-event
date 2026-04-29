import { useCallback } from 'react'

export function useEventSearch() {
  const applyFilters = useCallback((events, filters, sortBy) => {
    let filtered = [...events]

    // Apply price filter
    if (filters?.priceRange) {
      filtered = filtered.filter(event => {
        if (filters.priceRange === 'free') {
          return event.is_free
        }
        const price = event.price || 0
        const [min, max] = filters.priceRange === '0-25' ? [0, 25]
          : filters.priceRange === '25-100' ? [25, 100]
          : filters.priceRange === '100+' ? [100, Infinity]
          : [0, Infinity]
        return price >= min && price <= max
      })
    }

    // Apply date filter
    if (filters?.dateRange) {
      const now = new Date()
      const rangeEnd = new Date(now.getTime() + filters.dateRange * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(event => {
        if (!event.start_date) return false
        const eventDate = new Date(event.start_date)
        return eventDate >= now && eventDate <= rangeEnd
      })
    }

    // Apply location filter
    if (filters?.location && filters.location.trim()) {
      const searchTerm = filters.location.toLowerCase()
      filtered = filtered.filter(event =>
        event.location && event.location.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'soonest':
          filtered.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
          break
        case 'price-low':
          filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
          break
        case 'price-high':
          filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
          break
        case 'trending':
          // Sort by tickets sold (descending) - assumes ticketsSoldMap available
          filtered.sort((a, b) => (b.tickets_sold || 0) - (a.tickets_sold || 0))
          break
        case 'popular':
          // Sort by save count (descending)
          filtered.sort((a, b) => (b.save_count || 0) - (a.save_count || 0))
          break
        case 'newest':
        default:
          // Already sorted by newest from database
          break
      }
    }

    return filtered
  }, [])

  const getActiveFilterCount = useCallback((filters) => {
    let count = 0
    if (filters?.priceRange) count++
    if (filters?.dateRange) count++
    if (filters?.location && filters.location.trim()) count++
    return count
  }, [])

  return {
    applyFilters,
    getActiveFilterCount,
  }
}
