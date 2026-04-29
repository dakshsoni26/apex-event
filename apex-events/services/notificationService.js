import { supabase } from '../supabaseClient'

// Notification preferences stored in user metadata
export const notificationService = {
  // Get user's notification preferences
  async getPreferences(userId) {
    try {
      const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)
      if (error) throw error
      return user?.user_metadata?.notification_preferences || getDefaultPreferences()
    } catch (err) {
      console.error('Error fetching notification preferences:', err)
      return getDefaultPreferences()
    }
  },

  // Update notification preferences
  async updatePreferences(userId, preferences) {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { notification_preferences: preferences },
      })
      if (error) throw error
      return true
    } catch (err) {
      console.error('Error updating notification preferences:', err)
      return false
    }
  },

  // Send event reminder email (24 hours before event)
  async sendEventReminder(eventId, userId) {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (userError) throw userError

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      if (eventError) throw eventError

      // Check preferences
      const prefs = user.user_metadata?.notification_preferences || getDefaultPreferences()
      if (!prefs.email_event_reminders) return

      // Log the notification
      await supabase.from('notifications_sent').insert({
        user_id: userId,
        event_id: eventId,
        type: 'event_reminder',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      // In production, integrate with email service (Supabase, SendGrid, etc.)
      console.log(`Event reminder sent to ${user.email} for event: ${event.title}`)
      return true
    } catch (err) {
      console.error('Error sending event reminder:', err)
      return false
    }
  },

  // Send ticket confirmation email
  async sendTicketConfirmation(rsvpId, userId) {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (userError) throw userError

      // Get RSVP details
      const { data: rsvp, error: rsvpError } = await supabase
        .from('rsvps')
        .select('*, events(*)')
        .eq('id', rsvpId)
        .single()
      if (rsvpError) throw rsvpError

      // Check preferences
      const prefs = user.user_metadata?.notification_preferences || getDefaultPreferences()
      if (!prefs.email_ticket_updates) return

      // Log the notification
      await supabase.from('notifications_sent').insert({
        user_id: userId,
        event_id: rsvp.event_id,
        type: 'ticket_confirmation',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      console.log(`Ticket confirmation sent to ${user.email} for event: ${rsvp.events.title}`)
      return true
    } catch (err) {
      console.error('Error sending ticket confirmation:', err)
      return false
    }
  },

  // Send saved event category alert (new events in user's saved categories)
  async sendCategoryAlert(eventId, userId) {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (userError) throw userError

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      if (eventError) throw eventError

      // Check preferences
      const prefs = user.user_metadata?.notification_preferences || getDefaultPreferences()
      if (!prefs.email_category_alerts) return

      // Log the notification
      await supabase.from('notifications_sent').insert({
        user_id: userId,
        event_id: eventId,
        type: 'category_alert',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      console.log(`Category alert sent to ${user.email} for event: ${event.title}`)
      return true
    } catch (err) {
      console.error('Error sending category alert:', err)
      return false
    }
  },

  // Get notification history
  async getHistory(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications_sent')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching notification history:', err)
      return []
    }
  },
}

// Default notification preferences
export function getDefaultPreferences() {
  return {
    email_ticket_updates: true,
    email_event_reminders: true,
    email_category_alerts: false,
    email_marketing: false,
    push_bookings: true,
    push_reminders: true,
  }
}
