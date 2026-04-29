import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="auth-page">
      <div className="auth-image">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, rgba(79,70,229,0.15), transparent 35%), radial-gradient(circle at bottom right, rgba(249,115,22,0.08), transparent 30%)' }} />
      </div>

      <div className="auth-form-side" style={{ background: 'linear-gradient(150deg, #faf7f4 0%, #fff5f0 100%)' }}>
        <div style={{ maxWidth: '560px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', padding: '0.45rem 0.8rem', borderRadius: '999px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
            <span className="logo-icon" style={{ width: 28, height: 28, borderRadius: 9, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/apex_logo.png" alt="Apex Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600 }}>Event booking for hosts and guests</span>
          </div>
          <h1 style={{ fontSize: '3.4rem', lineHeight: 0.95, maxWidth: '9ch' }}>Make every event feel curated.</h1>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '46ch' }}>
            Apex Events gives hosts a clean dashboard for publishing events, managing capacity, and tracking RSVPs, while guests get a fast browsing and ticketing flow.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '2rem' }}>
            <Link to="/signin" className="btn-primary" style={{ width: 'auto', paddingInline: '1.4rem', margin: 0, textDecoration: 'none' }}>Sign in</Link>
            <Link to="/signup" className="btn-outline" style={{ width: 'auto', paddingInline: '1.4rem', textDecoration: 'none' }}>Create account</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.9rem' }}>
            {[
              ['Discover', 'Browse curated events with categories and search.'],
              ['Host', 'Create events, manage RSVPs, and see upcoming plans.'],
              ['Tickets', 'Book a seat, save tickets, and show QR codes later.'],
            ].map(([title, copy]) => (
              <div key={title} className="card">
                <h3 style={{ marginBottom: '0.55rem' }}>{title}</h3>
                <p style={{ fontSize: '0.86rem', lineHeight: 1.55, color: 'var(--text2)' }}>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}