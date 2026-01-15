// Notification service - uses Capacitor Local Notifications when available
import { Reminder } from '@/types';

interface NotificationService {
  requestPermission(): Promise<boolean>;
  scheduleReminder(reminder: Reminder): Promise<void>;
  cancelReminder(id: string): Promise<void>;
  cancelAll(): Promise<void>;
}

class NotificationServiceImpl implements NotificationService {
  private hasPermission = false;
  private pendingNotifications: Map<string, number> = new Map();

  async requestPermission(): Promise<boolean> {
    // Check if we're in a Capacitor environment
    if (typeof (window as any).Capacitor !== 'undefined') {
      // Capacitor Local Notifications - permission is requested on first schedule
      this.hasPermission = true;
      return true;
    }

    // Web Notifications API fallback
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
  }

  async scheduleReminder(reminder: Reminder): Promise<void> {
    const now = new Date().getTime();
    const triggerTime = reminder.datetime.getTime();
    const delay = triggerTime - now;

    if (delay <= 0) {
      console.warn('Reminder time has passed, not scheduling');
      return;
    }

    // Cancel any existing notification for this reminder
    await this.cancelReminder(reminder.id);

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
              id: this.generateNumericId(reminder.id),
              title: '🔔 Reminder',
              body: reminder.title,
              schedule: { at: reminder.datetime },
              sound: 'default',
              extra: {
                reminderId: reminder.id,
                category: reminder.category,
              },
            },
          ],
        });

        console.log(`Scheduled Capacitor notification for: ${reminder.title}`);
      } catch (error) {
        console.error('Capacitor notification error:', error);
        // Fall back to web notifications
        this.scheduleWebNotification(reminder, delay);
      }
    } else {
      // Use web notifications as fallback
      this.scheduleWebNotification(reminder, delay);
    }
  }

  private scheduleWebNotification(reminder: Reminder, delay: number): void {
    // Use setTimeout for web fallback
    const timeoutId = window.setTimeout(async () => {
      if (this.hasPermission && 'Notification' in window) {
        new Notification('🔔 Reminder', {
          body: reminder.title,
          icon: '/favicon.ico',
          tag: reminder.id,
          requireInteraction: true,
        });
      }
      this.pendingNotifications.delete(reminder.id);
    }, delay);

    this.pendingNotifications.set(reminder.id, timeoutId);
    console.log(`Scheduled web notification for: ${reminder.title} in ${Math.round(delay / 1000)}s`);
  }

  async cancelReminder(id: string): Promise<void> {
    // Cancel Capacitor notification if available
    if (typeof (window as any).Capacitor !== 'undefined') {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({
          notifications: [{ id: this.generateNumericId(id) }],
        });
      } catch (error) {
        console.error('Error canceling Capacitor notification:', error);
      }
    }

    // Cancel web notification timeout
    const timeoutId = this.pendingNotifications.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
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

  private generateNumericId(stringId: string): number {
    // Convert UUID to a numeric ID for Capacitor
    let hash = 0;
    for (let i = 0; i < stringId.length; i++) {
      const char = stringId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const notificationService = new NotificationServiceImpl();
