import { Ticket, MapPin, CalendarDays, Users } from 'lucide-react'

const formatMoney = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value || 0)

export default function OrderSummary({ event, quantity, total, onQuantityChange }) {
  if (!event) return null

  const unitPrice = event.is_free ? 0 : (event.price || 0)
  const discount = 0 // Can be added later for promo codes
  const tax = 0 // Can be calculated based on location later
  const finalTotal = total - discount + tax

  return (
    <div className="order-summary-card">
      <div className="summary-header">
        <Ticket size={20} />
        <h3>Order Summary</h3>
      </div>

      {/* Event Details */}
      <div className="summary-event">
        <div className="summary-event-title">{event.title}</div>
        
        <div className="summary-event-details">
          {event.start_date && (
            <div className="detail-row">
              <CalendarDays size={16} />
              <span>{new Date(event.start_date).toLocaleDateString('en-GB', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
          )}
          
          {event.location && (
            <div className="detail-row">
              <MapPin size={16} />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="summary-quantity">
        <label>
          <div className="quantity-label">
            <Users size={16} />
            <span>Tickets ({quantity})</span>
          </div>
          <input 
            type="number" 
            min="1" 
            max="99" 
            value={quantity}
            onChange={(e) => onQuantityChange?.(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
            aria-label="Number of tickets"
          />
        </label>
      </div>

      {/* Price Breakdown */}
      <div className="summary-breakdown">
        <div className="breakdown-row">
          <span>
            {event.is_free ? 'Free' : `${formatMoney(unitPrice)}`} × {quantity}
          </span>
          <span className="breakdown-amount">{formatMoney(total)}</span>
        </div>

        {discount > 0 && (
          <div className="breakdown-row discount">
            <span>Discount</span>
            <span className="breakdown-amount discount-amount">-{formatMoney(discount)}</span>
          </div>
        )}

        {tax > 0 && (
          <div className="breakdown-row">
            <span>Tax</span>
            <span className="breakdown-amount">{formatMoney(tax)}</span>
          </div>
        )}

        <div className="breakdown-divider" />

        <div className="breakdown-total">
          <span>Total</span>
          <span className="total-amount">
            {finalTotal > 0 ? formatMoney(finalTotal) : 'Free'}
          </span>
        </div>
      </div>

      {/* Payment Info */}
      {finalTotal > 0 && (
        <div className="payment-info">
          <div className="info-item">
            <div className="info-icon">🔒</div>
            <div>
              <strong>Secure Payment</strong>
              <small>Powered by Stripe</small>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">✓</div>
            <div>
              <strong>Instant Confirmation</strong>
              <small>Get your tickets immediately</small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
