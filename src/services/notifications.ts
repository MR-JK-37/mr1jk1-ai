// Notification service - uses Capacitor Local Notifications when available
import { Reminder } from '@/types';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

type PendingNotification =
  | { kind: 'capacitor'; notificationId: number }
  | { kind: 'web'; timeoutId: number };

interface NotificationService {
  init(): Promise<void>;
  requestPermission(): Promise<boolean>;
  getPermissionStatus(): Promise<PermissionStatus>;
  scheduleReminder(reminder: Reminder): Promise<number>;
  cancelReminder(id: string): Promise<void>;
  cancelAll(): Promise<void>;
  rescheduleDaily(reminder: Reminder): Promise<void>;
}

class NotificationServiceImpl implements NotificationService {
  private hasPermission = false;
  private pendingNotifications: Map<string, PendingNotification> = new Map();
  private notificationCounter = 1;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    if (typeof (window as any).Capacitor === 'undefined') {
      this.initialized = true;
      return;
    }

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Ensure we have a channel on Android 8+
      try {
        await LocalNotifications.createChannel({
          id: 'mrjk_reminders',
          name: 'MR!JK! Reminders',
          description: 'Reminder notifications from MR!JK!',
          importance: 5, // max
          visibility: 1, // public
          sound: 'beep.wav',
          lights: true,
          vibration: true,
        });
      } catch (e) {
        // Some platforms may not support channels; do not fail init.
        console.debug('Notification channel create skipped:', e);
      }

      // Useful logs for device debugging
      LocalNotifications.addListener('localNotificationReceived', (n) => {
        console.log('[MR!JK!] localNotificationReceived', n);
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
        console.log('[MR!JK!] localNotificationActionPerformed', a);
      });
    } catch (error) {
      console.error('Notification init error:', error);
    } finally {
      this.initialized = true;
    }
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    if (typeof (window as any).Capacitor !== 'undefined') {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permStatus = await LocalNotifications.checkPermissions();
        return permStatus.display as PermissionStatus;
      } catch {
        return 'unsupported';
      }
    }

    if ('Notification' in window) {
      return Notification.permission as PermissionStatus;
    }

    return 'unsupported';
  }

  async requestPermission(): Promise<boolean> {
    await this.init();

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
    await this.init();

    const now = Date.now();
    const triggerTime = new Date(reminder.datetime).getTime();
    const delay = triggerTime - now;

    // For daily reminders, if time has passed today, schedule for tomorrow
    let actualTriggerTime = triggerTime;
    if (reminder.type === 'daily' && delay <= 0) {
      const tomorrow = new Date(reminder.datetime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      actualTriggerTime = tomorrow.getTime();
    } else if (delay <= 0) {
      console.warn('[MR!JK!] Reminder time has passed, not scheduling', reminder);
      return 0;
    }

    // Cancel any existing notification for this reminder
    await this.cancelReminder(reminder.id);

    // Generate unique notification ID
    const notificationId =
      reminder.type === 'daily'
        ? this.generateDailyNotificationId(reminder.id)
        : this.generateNotificationId();

    // Native (Capacitor)
    if (typeof (window as any).Capacitor !== 'undefined') {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          const requested = await LocalNotifications.requestPermissions();
          this.hasPermission = requested.display === 'granted';
        } else {
          this.hasPermission = true;
        }

        if (!this.hasPermission) {
          console.warn('[MR!JK!] Notifications permission not granted; not scheduling');
          return 0;
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: reminder.type === 'daily' ? 'MR!JK! • Daily Reminder' : 'MR!JK! • Reminder',
              body: reminder.title,
              schedule: { at: new Date(actualTriggerTime) },
              channelId: 'mrjk_reminders',
              sound: 'beep.wav',
              extra: {
                reminderId: reminder.id,
                category: reminder.category,
                type: reminder.type,
                scheduledAt: actualTriggerTime,
              },
            },
          ],
        });

        this.pendingNotifications.set(reminder.id, { kind: 'capacitor', notificationId });
        console.log('[MR!JK!] Scheduled native notification', {
          reminderId: reminder.id,
          notificationId,
          at: new Date(actualTriggerTime).toString(),
          type: reminder.type,
        });
        return notificationId;
      } catch (error) {
        console.error('Capacitor notification schedule error:', error);
        // Fall back to web notifications
        return this.scheduleWebNotification(reminder, actualTriggerTime - now);
      }
    }

    // Web fallback
    return this.scheduleWebNotification(reminder, actualTriggerTime - now);
  }

  private scheduleWebNotification(reminder: Reminder, delay: number): number {
    const timeoutId = window.setTimeout(async () => {
      if (this.hasPermission && 'Notification' in window) {
        new Notification(`MR!JK! • ${reminder.type === 'daily' ? 'Daily Reminder' : 'Reminder'}`, {
          body: reminder.title,
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

    this.pendingNotifications.set(reminder.id, { kind: 'web', timeoutId });
    console.log('[MR!JK!] Scheduled web notification', {
      reminderId: reminder.id,
      inSeconds: Math.round(delay / 1000),
      type: reminder.type,
    });
    return timeoutId;
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
    const pending = this.pendingNotifications.get(id);

    // Cancel native notification
    if (typeof (window as any).Capacitor !== 'undefined' && pending?.kind === 'capacitor') {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({
          notifications: [{ id: pending.notificationId }],
        });
      } catch (error) {
        console.error('Error canceling native notification:', error);
      }
    }

    // Cancel web timeout
    if (pending?.kind === 'web') {
      window.clearTimeout(pending.timeoutId);
    }

    this.pendingNotifications.delete(id);
  }

  async cancelAll(): Promise<void> {
    // Cancel all native notifications
    if (typeof (window as any).Capacitor !== 'undefined') {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      } catch (error) {
        console.error('Error canceling all native notifications:', error);
      }
    }

    // Cancel all web timeouts
    this.pendingNotifications.forEach((pending) => {
      if (pending.kind === 'web') window.clearTimeout(pending.timeoutId);
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
