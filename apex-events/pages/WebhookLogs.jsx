import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw, Zap } from 'lucide-react'
import Layout from '../components/Layout'

const EVENT_LABELS = {
  'checkout.session.completed': 'Payment complete',
  'payment_intent.succeeded': 'Payment succeeded',
  'payment_intent.payment_failed': 'Payment failed',
  'customer.subscription.created': 'Subscription created',
  'customer.subscription.deleted': 'Subscription cancelled',
}

function LogEntry({ log }) {
  const [open, setOpen] = useState(false)
  const eventType = log.payload?.type || 'event'
  const label = EVENT_LABELS[eventType] || eventType
  const isError = eventType.includes('fail') || eventType.includes('error')
  const source = log.source || 'generic'

  return (
    <div className="log-entry">
      <div className="log-header" onClick={() => setOpen((o) => !o)}>
        <div className="log-header-left">
          {open ? <ChevronDown size={16} style={{ color: 'var(--text3)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
          <span className={`log-type-badge ${isError ? 'error' : ''}`}>{label}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'Courier New, monospace' }}>
            {log.payload?.id ? log.payload.id.slice(0, 28) + '…' : `#${log.id}`}
          </span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text3)', flexShrink: 0 }}>
          {source === 'stripe' && <span style={{ marginRight: '0.5rem', color: 'var(--accent)', fontWeight: 600 }}>Stripe</span>}
          {new Date(log.receivedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
      {open && (
        <div className="log-body">
          <pre>{JSON.stringify(log.payload, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default function WebhookLogs({ profile }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/webhooks/logs')
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
      setLastRefreshed(new Date())
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <div>
          <h1>Webhook Logs</h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.35rem' }}>
            Incoming Stripe webhook events received by the local server. Last 200 events are kept.
          </p>
        </div>
        <button className="btn-outline" onClick={fetchLogs} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {lastRefreshed && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: '1.5rem' }}>
          Last refreshed {lastRefreshed.toLocaleTimeString('en-GB')}
        </p>
      )}

      {logs.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"><Zap size={36} /></div>
          <h3>No webhook events yet</h3>
          <p>
            Stripe events will appear here once the server receives them.
            Use the Stripe CLI: <code style={{ background: 'var(--bg2)', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.82rem' }}>stripe listen --forward-to localhost:4242/api/stripe/webhook</code>
          </p>
        </div>
      ) : (
        <div className="list-card">
          {logs.map((log) => <LogEntry key={log.id} log={log} />)}
        </div>
      )}
    </Layout>
  )
}
