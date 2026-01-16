// Secure storage service - uses localStorage for demo, replace with Capacitor SecureStorage in production
import { APIConfig, Message, Reminder, CalendarEvent, AIMode, Note } from '@/types';

const STORAGE_KEYS = {
  API_CONFIG: 'jk_assistant_api_config',
  MESSAGES: 'jk_assistant_messages',
  REMINDERS: 'jk_assistant_reminders',
  EVENTS: 'jk_assistant_events',
  NOTES: 'jk_assistant_notes',
  MODE: 'jk_assistant_mode',
  INTRO_SEEN: 'jk_assistant_intro_seen',
  LAST_DAILY_RESET: 'jk_assistant_last_daily_reset',
};

// In production, replace with Capacitor SecureStorage or platform keystore
export const secureStorage = {
  async setApiConfig(config: APIConfig): Promise<void> {
    // WARNING: In production, use Capacitor SecureStorage
    // @capacitor/secure-storage-plugin for Android/iOS
    localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
  },

  async getApiConfig(): Promise<APIConfig | null> {
    const data = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    return data ? JSON.parse(data) : null;
  },

  async clearApiConfig(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.API_CONFIG);
  },
};

export const storage = {
  // Messages
  async saveMessages(messages: Message[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  },

  async getMessages(): Promise<Message[]> {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!data) return [];
    return JSON.parse(data).map((m: Message) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  },

  // Reminders
  async saveReminders(reminders: Reminder[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  },

  async getReminders(): Promise<Reminder[]> {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!data) return [];
    return JSON.parse(data).map((r: Reminder) => ({
      ...r,
      datetime: new Date(r.datetime),
      type: r.type || 'event', // Default to event for backward compatibility
    }));
  },

  // Events
  async saveEvents(events: CalendarEvent[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  },

  async getEvents(): Promise<CalendarEvent[]> {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!data) return [];
    return JSON.parse(data).map((e: CalendarEvent) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
  },

  // Notes
  async saveNotes(notes: Note[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },

  async getNotes(): Promise<Note[]> {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!data) return [];
    return JSON.parse(data).map((n: Note) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  },

  // Mode preference
  async saveMode(mode: AIMode): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
  },

  async getMode(): Promise<AIMode> {
    return (localStorage.getItem(STORAGE_KEYS.MODE) as AIMode) || 'emotional';
  },

  // Intro seen
  async setIntroSeen(seen: boolean): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, String(seen));
  },

  async hasSeenIntro(): Promise<boolean> {
    return localStorage.getItem(STORAGE_KEYS.INTRO_SEEN) === 'true';
  },

  // Daily reset tracking
  async getLastDailyReset(): Promise<string | null> {
    return localStorage.getItem(STORAGE_KEYS.LAST_DAILY_RESET);
  },

  async setLastDailyReset(date: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LAST_DAILY_RESET, date);
  },
};
