const getServerUrl = () => {
  const base = import.meta.env.VITE_STRIPE_API_URL?.trim()
  if (!base) return ''
  return base.replace(/\/$/, '')
}

export async function sendBookingConfirmation({ to, toName, eventTitle, ticketCode, ticketCount, totalPaid, isFree }) {
  try {
    const response = await fetch(`${getServerUrl()}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, toName, eventTitle, ticketCode, ticketCount, totalPaid, isFree }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.warn('Email send failed:', data.error || response.statusText)
    }
  } catch (error) {
    // Email is best-effort — never block the user flow
    console.warn('Email service unreachable:', error.message)
  }
}

// Legacy export used by PublicRSVP
export async function sendRSVPConfirmation(details) {
  return sendBookingConfirmation(details)
}
