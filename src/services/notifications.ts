// Notification service - uses Capacitor Local Notifications when available
import { Reminder } from '@/types';
import { Capacitor } from '@capacitor/core';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

type PendingNotification = { kind: 'web'; timeoutId: number };

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
  private pendingWebNotifications: Map<string, PendingNotification> = new Map();
  private initialized = false;

  private isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Stable IDs are critical so we can cancel notifications after app restarts.
   * Keep them in a safe range (< 2^31).
   */
  private stableNotificationId(reminderId: string, kind: 'event' | 'daily'): number {
    let hash = 0;
    for (let i = 0; i < reminderId.length; i++) {
      const char = reminderId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const base = Math.abs(hash) % 1000000;
    return (kind === 'daily' ? 2000000 : 1000000) + base;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    if (!this.isNative()) {
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
          lights: true,
          vibration: true,
        });
      } catch (e) {
        // Some platforms may not support channels; do not fail init.
        console.debug('[MR!JK!] Notification channel create skipped:', e);
      }

      // Useful logs for device debugging
      LocalNotifications.addListener('localNotificationReceived', (n) => {
        console.log('[MR!JK!] localNotificationReceived', n);
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
        console.log('[MR!JK!] localNotificationActionPerformed', a);
      });

      console.log('[MR!JK!] NotificationService initialized (native)');
    } catch (error) {
      console.error('[MR!JK!] Notification init error:', error);
    } finally {
      this.initialized = true;
    }
  }

  async getPermissionStatus(): Promise<PermissionStatus> {
    if (this.isNative()) {
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

    if (this.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        const before = await LocalNotifications.checkPermissions();
        console.log('[MR!JK!] Notification permission (before):', before.display);

        if (before.display === 'granted') {
          this.hasPermission = true;
          return true;
        }

        const requested = await LocalNotifications.requestPermissions();
        console.log('[MR!JK!] Notification permission (after):', requested.display);
        this.hasPermission = requested.display === 'granted';
        return this.hasPermission;
      } catch (error) {
        console.error('[MR!JK!] Native notification permission error:', error);
        return false;
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

    await this.cancelReminder(reminder.id);

    // Native (Capacitor)
    if (this.isNative()) {
      const notificationId = this.stableNotificationId(reminder.id, reminder.type);

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
              schedule:
                reminder.type === 'daily'
                  ? {
                      at: new Date(actualTriggerTime),
                      repeats: true,
                      every: 'day',
                    }
                  : { at: new Date(actualTriggerTime) },
              channelId: 'mrjk_reminders',
              extra: {
                reminderId: reminder.id,
                category: reminder.category,
                type: reminder.type,
                scheduledAt: actualTriggerTime,
              },
            },
          ],
        });

        const pending = await LocalNotifications.getPending();
        console.log('[MR!JK!] Scheduled native notification', {
          reminderId: reminder.id,
          notificationId,
          at: new Date(actualTriggerTime).toString(),
          type: reminder.type,
          pendingCount: pending.notifications.length,
        });

        return notificationId;
      } catch (error) {
        console.error('[MR!JK!] Native notification schedule error:', error);
        // IMPORTANT: never silently fall back to web timers in a native APK.
        throw error;
      }
    }

    // Web fallback (NOT reliable when the app is closed; used only for browser use)
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
      this.pendingWebNotifications.delete(reminder.id);

      // For daily reminders (web only), reschedule for tomorrow
      if (reminder.type === 'daily') {
        const tomorrow = new Date(reminder.datetime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const newReminder = { ...reminder, datetime: tomorrow };
        setTimeout(() => this.scheduleReminder(newReminder), 1000);
      }
    }, delay);

    this.pendingWebNotifications.set(reminder.id, { kind: 'web', timeoutId });
    console.log('[MR!JK!] Scheduled web notification', {
      reminderId: reminder.id,
      inSeconds: Math.round(delay / 1000),
      type: reminder.type,
    });
    return timeoutId;
  }

  async rescheduleDaily(reminder: Reminder): Promise<void> {
    if (reminder.type !== 'daily') return;

    // In native, daily reminders are scheduled with repeats=true/every='day'.
    // We still re-run scheduling on app start to ensure they exist.
    const now = new Date();
    const reminderTime = new Date(reminder.datetime);
    reminderTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

    if (reminderTime.getTime() <= now.getTime()) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const updatedReminder = { ...reminder, datetime: reminderTime, completed: false };
    await this.scheduleReminder(updatedReminder);
  }

  async cancelReminder(id: string): Promise<void> {
    // Cancel native notifications (try both kinds since callers only provide reminderId)
    if (this.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({
          notifications: [
            { id: this.stableNotificationId(id, 'event') },
            { id: this.stableNotificationId(id, 'daily') },
          ],
        });
      } catch (error) {
        console.error('[MR!JK!] Error canceling native notification:', error);
      }
    }

    // Cancel web timeout
    const pending = this.pendingWebNotifications.get(id);
    if (pending?.kind === 'web') {
      window.clearTimeout(pending.timeoutId);
    }
    this.pendingWebNotifications.delete(id);
  }

  async cancelAll(): Promise<void> {
    if (this.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      } catch (error) {
        console.error('[MR!JK!] Error canceling all native notifications:', error);
      }
    }

    this.pendingWebNotifications.forEach((pending) => {
      if (pending.kind === 'web') window.clearTimeout(pending.timeoutId);
    });
    this.pendingWebNotifications.clear();
  }
}

export const notificationService = new NotificationServiceImpl();
