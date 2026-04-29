import { Bell, Mail, Smartphone } from 'lucide-react'

export default function NotificationPreferences({ notifications, onNotificationChange }) {
  return (
    <div className="settings-section">
      <div className="section-header">
        <h3>Notification Preferences</h3>
        <p>Choose how you want to receive updates</p>
      </div>

      {/* Email Notifications */}
      <div className="preference-group">
        <div className="preference-header">
          <Mail size={20} />
          <div>
            <h4>Email Notifications</h4>
            <p>Receive emails about events and your bookings</p>
          </div>
        </div>

        <div className="preference-options">
          <label className="preference-item">
            <input
              type="checkbox"
              checked={notifications.email_ticket_updates ?? true}
              onChange={(e) => onNotificationChange('email_ticket_updates', e.target.checked)}
            />
            <span>
              <strong>Ticket Confirmations</strong>
              <small>Get confirmation when you book a ticket</small>
            </span>
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              checked={notifications.email_event_reminders ?? true}
              onChange={(e) => onNotificationChange('email_event_reminders', e.target.checked)}
            />
            <span>
              <strong>Event Reminders</strong>
              <small>Reminder 24 hours before your events</small>
            </span>
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              checked={notifications.email_category_alerts ?? false}
              onChange={(e) => onNotificationChange('email_category_alerts', e.target.checked)}
            />
            <span>
              <strong>Category Alerts</strong>
              <small>New events in your favorite categories</small>
            </span>
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              checked={notifications.email_marketing ?? false}
              onChange={(e) => onNotificationChange('email_marketing', e.target.checked)}
            />
            <span>
              <strong>Marketing & Promotions</strong>
              <small>Special offers and new features</small>
            </span>
          </label>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="preference-group">
        <div className="preference-header">
          <Smartphone size={20} />
          <div>
            <h4>Push Notifications</h4>
            <p>Browser notifications for important updates</p>
          </div>
        </div>

        <div className="preference-options">
          <label className="preference-item">
            <input
              type="checkbox"
              checked={notifications.push_bookings ?? true}
              onChange={(e) => onNotificationChange('push_bookings', e.target.checked)}
            />
            <span>
              <strong>New Bookings</strong>
              <small>Alert when you successfully book an event</small>
            </span>
          </label>

          <label className="preference-item">
            <input
              type="checkbox"
              checked={notifications.push_reminders ?? true}
              onChange={(e) => onNotificationChange('push_reminders', e.target.checked)}
            />
            <span>
              <strong>Event Reminders</strong>
              <small>Reminder when your events are starting soon</small>
            </span>
          </label>
        </div>
      </div>

      {/* Notification Info */}
      <div className="notification-info">
        <Bell size={18} />
        <div>
          <strong>Notification Management</strong>
          <p>You can manage these preferences at any time. Disabling all notifications is not recommended as you may miss important event updates.</p>
        </div>
      </div>
    </div>
  )
}
