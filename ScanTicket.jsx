import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, QrCode, RotateCcw, ScanLine, XCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

function parseApexQr(text) {
  const match = text.match(/APEX-TICKET:([^|]+)\|EVENT:([^|]+)\|GUEST:(.+)/)
  if (!match) return null
  return { ticketCode: match[1], eventId: match[2], guestId: match[3] }
}

export default function ScanTicket({ session, profile }) {
  const html5QrcodeRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [result, setResult] = useState(null)
  const [checkingIn, setCheckingIn] = useState(false)

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanner = async () => {
    setCameraError(null)
    setResult(null)

    // Lazy-load html5-qrcode so a missing install gives a clear error
    let Html5Qrcode
    try {
      const mod = await import('html5-qrcode')
      Html5Qrcode = mod.Html5Qrcode
    } catch {
      setCameraError('html5-qrcode is not installed. Run: npm install html5-qrcode')
      return
    }

    const scanner = new Html5Qrcode('apex-qr-reader')
    html5QrcodeRef.current = scanner
    setScanning(true)

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decoded) => {
          await scanner.stop().catch(() => {})
          setScanning(false)
          await verifyTicket(decoded)
        },
        () => {} // suppress per-frame decode failures
      )
    } catch (err) {
      setScanning(false)
      if (err.message?.toLowerCase().includes('permission')) {
        setCameraError('Camera access denied. Allow camera permission in your browser and try again.')
      } else {
        setCameraError(err.message || 'Could not start camera.')
      }
    }
  }

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      await html5QrcodeRef.current.stop().catch(() => {})
    }
    setScanning(false)
  }

  const verifyTicket = async (text) => {
    const parsed = parseApexQr(text)

    if (!parsed) {
      setResult({ valid: false, error: 'Not a valid APEX ticket. The QR code format is unrecognised.' })
      return
    }

    const { data, error } = await supabase
      .from('rsvps')
      .select('id, guest_name, guest_email, ticket_count, total_paid, checked_in_at, events(id, title, host_id, is_free)')
      .eq('ticket_code', parsed.ticketCode)
      .eq('event_id', parsed.eventId)
      .eq('guest_id', parsed.guestId)
      .maybeSingle()

    if (error) {
      setResult({ valid: false, error: `Database error: ${error.message}` })
      return
    }

    if (!data) {
      setResult({ valid: false, error: 'Ticket not found. It may have been cancelled or never existed.' })
      return
    }

    if (data.events?.host_id !== session.user.id) {
      setResult({ valid: false, error: "This ticket belongs to a different host's event." })
      return
    }

    setResult({
      valid: true,
      rsvpId: data.id,
      guestName: data.guest_name || 'Guest',
      guestEmail: data.guest_email || '',
      eventTitle: data.events?.title || 'Event',
      ticketCount: data.ticket_count || 1,
      totalPaid: data.total_paid || 0,
      isFree: data.events?.is_free,
      checkedInAt: data.checked_in_at,
      ticketCode: parsed.ticketCode,
    })
  }

  const handleCheckIn = async () => {
    if (!result?.rsvpId) return
    setCheckingIn(true)

    const { error } = await supabase
      .from('rsvps')
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', result.rsvpId)

    if (error) {
      toast.error(error.message)
    } else {
      setResult((prev) => ({ ...prev, checkedInAt: new Date().toISOString() }))
      toast.success(`${result.guestName} checked in`)
    }
    setCheckingIn(false)
  }

  const reset = () => {
    setResult(null)
    setCameraError(null)
  }

  return (
    <Layout profile={profile}>
      <div className="page-header">
        <div>
          <h1>Scan Tickets</h1>
          <p style={{ color: 'var(--text2)', marginTop: '0.35rem' }}>
            Use your device camera to verify guest tickets at the entrance.
          </p>
        </div>
      </div>

      <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Scanner panel */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <ScanLine size={18} /> Camera scanner
            </h3>
            {scanning && (
              <button className="btn-outline" onClick={stopScanner} style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}>
                Stop
              </button>
            )}
          </div>

          {/* Camera viewport — html5-qrcode renders into this div */}
          <div
            id="apex-qr-reader"
            style={{
              width: '100%',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#0a0a0a',
              minHeight: scanning ? 320 : 0,
              transition: 'min-height 0.2s',
            }}
          />

          {!scanning && (
            <div style={{ textAlign: 'center', padding: result || cameraError ? '1.25rem 0 0' : '2.5rem 0' }}>
              {!result && !cameraError && (
                <>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)', marginBottom: '0.85rem' }}>
                      <QrCode size={30} />
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      Point the camera at a guest's QR code to verify their ticket.
                    </p>
                  </div>
                  <button className="book-btn" onClick={startScanner} style={{ maxWidth: 280 }}>
                    Start scanning
                  </button>
                </>
              )}

              {(result || cameraError) && (
                <button className="btn-outline" onClick={() => { reset(); startScanner() }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RotateCcw size={15} /> Scan another
                </button>
              )}
            </div>
          )}

          {cameraError && (
            <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', background: '#fee2e2', borderRadius: 12, fontSize: '0.84rem', color: '#dc2626', lineHeight: 1.6 }}>
              {cameraError}
            </div>
          )}
        </div>

        {/* Result panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: result ? 'flex-start' : 'center', alignItems: result ? 'stretch' : 'center', minHeight: 320 }}>
          {!result ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem', lineHeight: 1 }}>—</div>
              <p style={{ fontSize: '0.88rem' }}>Scan result will appear here</p>
            </div>
          ) : result.valid ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <CheckCircle2 size={28} style={{ color: '#059669', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#059669' }}>Valid ticket</div>
                  {result.checkedInAt && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: '0.15rem' }}>
                      Checked in {new Date(result.checkedInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
                {[
                  { label: 'Guest', value: result.guestName },
                  { label: 'Email', value: result.guestEmail || '—' },
                  { label: 'Event', value: result.eventTitle },
                  { label: 'Tickets', value: `${result.ticketCount} ticket${result.ticketCount > 1 ? 's' : ''}` },
                  { label: 'Paid', value: result.isFree ? 'Free entry' : `£${result.totalPaid}` },
                  { label: 'Code', value: result.ticketCode, mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)', gap: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{label}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500, fontFamily: mono ? 'Courier New, monospace' : undefined }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {result.checkedInAt ? (
                <div style={{ padding: '0.9rem 1rem', background: 'rgba(5,150,105,0.08)', borderRadius: 12, textAlign: 'center', fontSize: '0.85rem', color: '#059669', fontWeight: 500 }}>
                  Already checked in at {new Date(result.checkedInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <button
                  className="book-btn"
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  style={{ background: '#059669', boxShadow: '0 4px 16px rgba(5,150,105,0.3)' }}
                >
                  {checkingIn ? 'Checking in…' : `Check in ${result.guestName.split(' ')[0]}`}
                </button>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <XCircle size={28} style={{ color: '#dc2626', flexShrink: 0 }} />
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#dc2626' }}>Invalid ticket</div>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.65 }}>{result.error}</p>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
