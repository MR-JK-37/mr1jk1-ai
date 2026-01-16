// Notification service - uses Capacitor Local Notifications when available
import { Reminder } from '@/types';

interface NotificationService {
  requestPermission(): Promise<boolean>;
  scheduleReminder(reminder: Reminder): Promise<number>;
  cancelReminder(id: string): Promise<void>;
  cancelAll(): Promise<void>;
  rescheduleDaily(reminder: Reminder): Promise<void>;
}

class NotificationServiceImpl implements NotificationService {
  private hasPermission = false;
  private pendingNotifications: Map<string, number> = new Map();
  private notificationCounter = 1;

  async requestPermission(): Promise<boolean> {
    // Check if we're in a Capacitor environment
    if (typeof (window as any).Capacitor !== 'undefined') {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permStatus = await LocalNotifications.checkPermissions();
        
        if (permStatus.display === 'granted') {
          this.hasPermission = true;
          return true;
        }
        
        const requested = await LocalNotifications.requestPermissions();
        this.hasPermission = requested.display === 'granted';
        return this.hasPermission;
      } catch (error) {
        console.error('Capacitor notification permission error:', error);
      }
    }

    // Web Notifications API fallback
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.hasPermission = true;
        return true;
      }
      
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
  }

  async scheduleReminder(reminder: Reminder): Promise<number> {
    const now = new Date().getTime();
    const triggerTime = new Date(reminder.datetime).getTime();
    const delay = triggerTime - now;

    // For daily reminders, if time has passed today, schedule for tomorrow
    let actualTriggerTime = triggerTime;
    if (reminder.type === 'daily' && delay <= 0) {
      const tomorrow = new Date(reminder.datetime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      actualTriggerTime = tomorrow.getTime();
    } else if (delay <= 0) {
      console.warn('Reminder time has passed, not scheduling');
      return 0;
    }

    const actualDelay = actualTriggerTime - now;

    // Cancel any existing notification for this reminder
    await this.cancelReminder(reminder.id);

    // Generate unique notification ID
    const notificationId = reminder.type === 'daily' 
      ? this.generateDailyNotificationId(reminder.id) 
      : this.generateNotificationId();

    // Check if Capacitor is available
    if (typeof (window as any).Capacitor !== 'undefined') {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        // Request permission if needed
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }

        // Schedule the notification
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: reminder.type === 'daily' ? '🔔 Daily Reminder' : '🔔 Reminder',
              body: `MR!JK! - ${reminder.title}`,
              schedule: { at: new Date(actualTriggerTime) },
              sound: 'default',
              extra: {
                reminderId: reminder.id,
                category: reminder.category,
                type: reminder.type,
              },
            },
          ],
        });

        this.pendingNotifications.set(reminder.id, notificationId);
        console.log(`Scheduled Capacitor notification for: ${reminder.title} at ${new Date(actualTriggerTime)}`);
        return notificationId;
      } catch (error) {
        console.error('Capacitor notification error:', error);
        // Fall back to web notifications
        return this.scheduleWebNotification(reminder, actualDelay, notificationId);
      }
    } else {
      // Use web notifications as fallback
      return this.scheduleWebNotification(reminder, actualDelay, notificationId);
    }
  }

  private scheduleWebNotification(reminder: Reminder, delay: number, notificationId: number): number {
    // Use setTimeout for web fallback
    const timeoutId = window.setTimeout(async () => {
      if (this.hasPermission && 'Notification' in window) {
        new Notification(`🔔 ${reminder.type === 'daily' ? 'Daily Reminder' : 'Reminder'}`, {
          body: `MR!JK! - ${reminder.title}`,
          icon: '/icons/icon-192x192.png',
          tag: reminder.id,
          requireInteraction: true,
        });
      }
      this.pendingNotifications.delete(reminder.id);
      
      // For daily reminders, reschedule for tomorrow
      if (reminder.type === 'daily') {
        const tomorrow = new Date(reminder.datetime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const newReminder = { ...reminder, datetime: tomorrow };
        setTimeout(() => this.scheduleReminder(newReminder), 1000);
      }
    }, delay);

    this.pendingNotifications.set(reminder.id, timeoutId);
    console.log(`Scheduled web notification for: ${reminder.title} in ${Math.round(delay / 1000)}s`);
    return notificationId;
  }

  async rescheduleDaily(reminder: Reminder): Promise<void> {
    if (reminder.type !== 'daily') return;

    // Set time to the original time but for today
    const now = new Date();
    const reminderTime = new Date(reminder.datetime);
    reminderTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    // If today's time has passed, schedule for tomorrow
    if (reminderTime.getTime() <= now.getTime()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const updatedReminder = { ...reminder, datetime: reminderTime, completed: false };
    await this.scheduleReminder(updatedReminder);
  }

  async cancelReminder(id: string): Promise<void> {
    const notificationId = this.pendingNotifications.get(id);
    
    // Cancel Capacitor notification if available
    if (typeof (window as any).Capacitor !== 'undefined' && notificationId) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({
          notifications: [{ id: notificationId }],
        });
      } catch (error) {
        console.error('Error canceling Capacitor notification:', error);
      }
    }

    // Cancel web notification timeout
    if (notificationId) {
      window.clearTimeout(notificationId);
      this.pendingNotifications.delete(id);
    }
  }

  async cancelAll(): Promise<void> {
    // Cancel all Capacitor notifications
    if (typeof (window as any).Capacitor !== 'undefined') {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      } catch (error) {
        console.error('Error canceling all Capacitor notifications:', error);
      }
    }

    // Cancel all web notification timeouts
    this.pendingNotifications.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    this.pendingNotifications.clear();
  }

  // Fixed ID for daily reminders based on reminder ID
  private generateDailyNotificationId(reminderId: string): number {
    let hash = 0;
    for (let i = 0; i < reminderId.length; i++) {
      const char = reminderId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 100000; // Keep it under 100000 for consistency
  }

  // Timestamp-based ID for event reminders
  private generateNotificationId(): number {
    return 100000 + (this.notificationCounter++ * 1000) + Math.floor(Math.random() * 1000);
  }
}

export const notificationService = new NotificationServiceImpl();
