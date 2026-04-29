import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, Compass, Heart, LayoutDashboard, LogOut, Plus, Settings2, Ticket, FileText, Users, Zap, ScanLine, BarChart3, Menu, X } from 'lucide-react'
import { supabase } from '../supabaseClient'

const GUEST_NAV = [
  { to: '/home', label: 'Discover', icon: Compass },
  { to: '/my-tickets', label: 'My Tickets', icon: Ticket },
  { to: '/saved', label: 'Saved Events', icon: Heart },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

const HOST_NAV = [
  { to: '/home', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/create-event', label: 'Create Event', icon: Plus },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings2 },
  { to: '/drafts', label: 'Drafts', icon: FileText },
  { to: '/templates', label: 'Templates', icon: FileText },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/webhook-logs', label: 'Webhooks', icon: Zap },
  { to: '/scan', label: 'Scan Tickets', icon: ScanLine },
]

export default function Layout({ children, profile }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const role = profile?.role || 'guest'
  const navLinks = role === 'host' ? HOST_NAV : GUEST_NAV
  const initials = (profile?.full_name || 'Apex User')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <Link to="/home" className="sidebar-logo" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">
            <img src="/apex_logo.png" alt="Apex Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
          </div>
          <span>APEX</span>
        </Link>

        <div className="sidebar-section-label">Navigation</div>
        <nav>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="av">{initials || 'A'}</div>
            <div className="user-card-info">
              <strong>{profile?.full_name || 'Apex User'}</strong>
              <span>{role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} type="button">
            <LogOut className="nav-icon" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu} aria-hidden="true" />
      )}

      {/* Mobile Sidebar */}
      <aside className={`sidebar mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <Link to="/home" className="sidebar-logo" style={{ textDecoration: 'none' }}>
            <div className="logo-icon">
              <img src="/apex_logo.png" alt="Apex Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            </div>
            <span>APEX</span>
          </Link>
          <button 
            className="mobile-close-btn" 
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <item.icon className="nav-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="av">{initials || 'A'}</div>
            <div className="user-card-info">
              <strong>{profile?.full_name || 'Apex User'}</strong>
              <span>{role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} type="button">
            <LogOut className="nav-icon" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            {/* Mobile hamburger menu button */}
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={24} />
            </button>
            <div className="topbar-text">
              <h2>APEX Events</h2>
              <p>
                {role === 'host'
                  ? 'Manage your events and guest flow'
                  : 'Find tickets, save favorites, and keep track of plans'}
              </p>
            </div>
          </div>
          <div className="topbar-right">
            {role === 'guest' && (
              <Link className="icon-btn" to="/saved" aria-label="Saved events">
                <Heart size={18} />
              </Link>
            )}
            <Link className="icon-btn" to="/settings" aria-label="Settings">
              <Settings2 size={18} />
            </Link>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
