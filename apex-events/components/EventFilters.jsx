import { ChevronDown, Filter, X } from 'lucide-react'
import { useState } from 'react'

export default function EventFilters({ 
  filters, 
  onFilterChange,
  onSortChange,
  sortBy = 'newest',
  activeFiltersCount = 0
}) {
  const [showFilters, setShowFilters] = useState(false)

  const handlePriceRangeChange = (range) => {
    onFilterChange('priceRange', range)
  }

  const handleDateRangeChange = (days) => {
    onFilterChange('dateRange', days)
  }

  const handleLocationChange = (location) => {
    onFilterChange('location', location)
  }

  const handleClearAll = () => {
    onFilterChange('priceRange', null)
    onFilterChange('dateRange', null)
    onFilterChange('location', '')
  }

  return (
    <div className="event-filters" role="region" aria-label="Event filtering and sorting">
      {/* Filter Toggle Button */}
      <button 
        className="filter-toggle"
        onClick={() => setShowFilters(!showFilters)}
        aria-expanded={showFilters}
        aria-controls="filter-panel"
      >
        <Filter size={18} />
        <span>Filters</span>
        {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
        <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Sort Dropdown */}
      <select 
        className="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Sort events"
      >
        <option value="newest">Newest</option>
        <option value="soonest">Soonest</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="trending">Trending</option>
        <option value="popular">Most Saved</option>
      </select>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel" id="filter-panel" role="region" aria-label="Filter options">
          <div className="filter-header">
            <h3>Filters</h3>
            {activeFiltersCount > 0 && (
              <button 
                className="clear-filters-btn"
                onClick={handleClearAll}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <label className="filter-label">Price Range</label>
            <div className="filter-options">
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="price" 
                  value="all"
                  checked={!filters?.priceRange}
                  onChange={() => handlePriceRangeChange(null)}
                />
                <span>All prices</span>
              </label>
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="price" 
                  value="free"
                  checked={filters?.priceRange === 'free'}
                  onChange={() => handlePriceRangeChange('free')}
                />
                <span>Free</span>
              </label>
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="price" 
                  value="0-25"
                  checked={filters?.priceRange === '0-25'}
                  onChange={() => handlePriceRangeChange('0-25')}
                />
                <span>£0 - £25</span>
              </label>
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="price" 
                  value="25-100"
                  checked={filters?.priceRange === '25-100'}
                  onChange={() => handlePriceRangeChange('25-100')}
                />
                <span>£25 - £100</span>
              </label>
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="price" 
                  value="100+"
                  checked={filters?.priceRange === '100+'}
                  onChange={() => handlePriceRangeChange('100+')}
                />
                <span>£100+</span>
              </label>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="filter-group">
            <label className="filter-label">When</label>
            <div className="filter-options">
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="date" 
                  value="all"
                  checked={!filters?.dateRange}
                  onChange={() => handleDateRangeChange(null)}
                />
                <span>Any time</span>
              </label>
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="date" 
                  value="7"
                  checked={filters?.dateRange === 7}
                  onChange={() => handleDateRangeChange(7)}
                />
                <span>Next 7 days</span>
              </label>
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="date" 
                  value="30"
                  checked={filters?.dateRange === 30}
                  onChange={() => handleDateRangeChange(30)}
                />
                <span>Next 30 days</span>
              </label>
              <label className="filter-option">
                <input 
                  type="radio" 
                  name="date" 
                  value="90"
                  checked={filters?.dateRange === 90}
                  onChange={() => handleDateRangeChange(90)}
                />
                <span>Next 3 months</span>
              </label>
            </div>
          </div>

          {/* Location Filter */}
          <div className="filter-group">
            <label className="filter-label">Location</label>
            <input 
              type="text"
              placeholder="Search location..."
              value={filters?.location || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="filter-input"
            />
            <small style={{ color: 'var(--text3)', marginTop: '0.5rem', display: 'block' }}>
              Partial match (e.g., 'London', 'New York')
            </small>
          </div>

          <button 
            className="filter-close-btn"
            onClick={() => setShowFilters(false)}
            aria-label="Close filters"
          >
            <X size={18} /> Close
          </button>
        </div>
      )}
    </div>
  )
}
