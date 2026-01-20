import { useState, useEffect, useCallback, useRef } from 'react';
import { AIMode, Message, Reminder, CalendarEvent, APIConfig, Note, ChatSession, AppSettings } from '@/types';
import { storage, secureStorage } from '@/services/storage';
import { aiRouter } from '@/services/ai-router';
import { notificationService } from '@/services/notifications';

const DEFAULT_APP_SETTINGS: AppSettings = {
  voiceSettings: {
    enabled: true,
    volume: 0.8,
    speed: 'normal',
    autoSpeak: true,
  },
  responseLength: 'concise',
};

export function useAppState() {
  const [mode, setModeState] = useState<AIMode>('emotional');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [apiConfig, setApiConfigState] = useState<APIConfig | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  
  const dailyResetInterval = useRef<number | null>(null);

  // Get current session's messages
  const currentSession = chatSessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Check and reset daily reminders at midnight
  const checkDailyReset = useCallback(async (currentReminders: Reminder[]) => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = await storage.getLastDailyReset();

    if (lastReset !== today) {
      const updatedReminders = currentReminders.map(r => {
        if (r.type === 'daily') {
          const newDatetime = new Date(r.datetime);
          const now = new Date();
          newDatetime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
          return { ...r, completed: false, datetime: newDatetime };
        }
        return r;
      });

      const now = new Date();
      const filteredReminders = updatedReminders.filter(r => {
        if (r.type === 'event' && new Date(r.datetime) < now) {
          notificationService.cancelReminder(r.id);
          return false;
        }
        return true;
      });

      setReminders(filteredReminders);
      await storage.saveReminders(filteredReminders);
      await storage.setLastDailyReset(today);

      for (const reminder of filteredReminders.filter(r => r.type === 'daily' && !r.completed)) {
        await notificationService.rescheduleDaily(reminder);
      }
    }
  }, []);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const [
          savedMode,
          savedSessions,
          savedSessionId,
          savedReminders,
          savedEvents,
          savedNotes,
          savedConfig,
          savedSettings,
          introSeen,
        ] = await Promise.all([
          storage.getMode(),
          storage.getChatSessions(),
          storage.getCurrentSessionId(),
          storage.getReminders(),
          storage.getEvents(),
          storage.getNotes(),
          secureStorage.getApiConfig(),
          storage.getAppSettings(),
          storage.hasSeenIntro(),
        ]);

        setModeState(savedMode);
        setChatSessions(savedSessions);
        setCurrentSessionId(savedSessionId);
        setEvents(savedEvents);
        setNotes(savedNotes);
        setApiConfigState(savedConfig);
        setAppSettings(savedSettings);
        setHasSeenIntro(introSeen);

        aiRouter.setMode(savedMode);
        await aiRouter.init();

        // Notifications (native when available)
        await notificationService.init();
        await notificationService.requestPermission();

        // Remove expired one-time event reminders (e.g., after they already fired while app was closed)
        const now = new Date();
        const cleanedReminders = savedReminders.filter(r => {
          if (r.type === 'event' && new Date(r.datetime) < now) {
            notificationService.cancelReminder(r.id);
            return false;
          }
          return true;
        });

        setReminders(cleanedReminders);
        if (cleanedReminders.length !== savedReminders.length) {
          await storage.saveReminders(cleanedReminders);
        }

        await checkDailyReset(cleanedReminders);

        // Reschedule pending reminders
        for (const reminder of cleanedReminders.filter(r => !r.completed)) {
          if (reminder.type === 'daily') {
            await notificationService.rescheduleDaily(reminder);
          } else {
            await notificationService.scheduleReminder(reminder);
          }
        }
      } catch (error) {
        console.error('Failed to load state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();

    const checkMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      dailyResetInterval.current = window.setTimeout(async () => {
        const currentReminders = await storage.getReminders();
        await checkDailyReset(currentReminders);
        checkMidnight();
      }, msUntilMidnight);
    };

    checkMidnight();

    return () => {
      if (dailyResetInterval.current) {
        clearTimeout(dailyResetInterval.current);
      }
    };
  }, [checkDailyReset]);

  // Mode management
  const setMode = useCallback(async (newMode: AIMode) => {
    setModeState(newMode);
    aiRouter.setMode(newMode);
    await storage.saveMode(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'emotional' ? 'technical' : 'emotional';
    setMode(newMode);
  }, [mode, setMode]);

  // Chat session management
  const createNewSession = useCallback(async () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      mode,
    };
    
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    
    await storage.saveChatSessions(updatedSessions);
    await storage.saveCurrentSessionId(newSession.id);
    
    return newSession;
  }, [chatSessions, mode]);

  const selectSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await storage.saveCurrentSessionId(sessionId);
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    const updatedSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(updatedSessions);
    
    if (currentSessionId === sessionId) {
      const newCurrentId = updatedSessions.length > 0 ? updatedSessions[0].id : null;
      setCurrentSessionId(newCurrentId);
      await storage.saveCurrentSessionId(newCurrentId);
    }
    
    await storage.saveChatSessions(updatedSessions);
  }, [chatSessions, currentSessionId]);

  const clearAllSessions = useCallback(async () => {
    setChatSessions([]);
    setCurrentSessionId(null);
    await storage.saveChatSessions([]);
    await storage.saveCurrentSessionId(null);
  }, []);

  // Message management
  const addMessage = useCallback(
    async (message: Omit<Message, 'id' | 'timestamp'>, targetSessionId?: string) => {
      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };

      let sessionId = targetSessionId ?? currentSessionId;
      let updatedSessions = [...chatSessions];

      // Create new session if none exists
      if (!sessionId) {
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          title: message.content.slice(0, 50) || 'New Chat',
          messages: [newMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
          mode: message.mode,
        };
        updatedSessions = [newSession, ...updatedSessions];
        sessionId = newSession.id;

        setCurrentSessionId(sessionId);
        await storage.saveCurrentSessionId(sessionId);
      } else {
        // Update existing session
        updatedSessions = updatedSessions.map((session) => {
          if (session.id === sessionId) {
            const updatedMessages = [...session.messages, newMessage];
            // Update title from first user message
            const title =
              session.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 50)
                : session.title;
            return {
              ...session,
              messages: updatedMessages,
              title,
              updatedAt: new Date(),
            };
          }
          return session;
        });
      }

      setChatSessions(updatedSessions);
      await storage.saveChatSessions(updatedSessions);

      return newMessage;
    },
    [chatSessions, currentSessionId]
  );

  const updateLastMessage = useCallback(
    async (content: string, targetSessionId?: string) => {
      const sessionId = targetSessionId ?? currentSessionId;
      if (!sessionId) return;

      const updatedSessions = chatSessions.map((session) => {
        if (session.id === sessionId && session.messages.length > 0) {
          const messages = [...session.messages];
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content,
          };
          return { ...session, messages, updatedAt: new Date() };
        }
        return session;
      });

      setChatSessions(updatedSessions);
      await storage.saveChatSessions(updatedSessions);
    },
    [chatSessions, currentSessionId]
  );

  // Reminder management
  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
    };
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await storage.saveReminders(updatedReminders);
    await notificationService.scheduleReminder(newReminder);
    return newReminder;
  }, [reminders]);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const updatedReminders = reminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    setReminders(updatedReminders);
    await storage.saveReminders(updatedReminders);
    
    if (!reminder.completed) {
      await notificationService.cancelReminder(id);
    } else if (reminder.type === 'daily') {
      await notificationService.rescheduleDaily({ ...reminder, completed: false });
    }
  }, [reminders]);

  const deleteReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder || reminder.type === 'daily') return;

    const updatedReminders = reminders.filter(r => r.id !== id);
    setReminders(updatedReminders);
    await storage.saveReminders(updatedReminders);
    await notificationService.cancelReminder(id);
  }, [reminders]);

  // Notes management
  const addNote = useCallback(async (content: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    await storage.saveNotes(updatedNotes);
    return newNote;
  }, [notes]);

  const deleteNote = useCallback(async (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    await storage.saveNotes(updatedNotes);
  }, [notes]);

  // Event management
  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    await storage.saveEvents(updatedEvents);
    return newEvent;
  }, [events]);

  // Settings management
  const setApiConfig = useCallback(async (config: APIConfig) => {
    await secureStorage.setApiConfig(config);
    setApiConfigState(config);
    await aiRouter.init();
  }, []);

  const saveAppSettings = useCallback(async (settings: AppSettings) => {
    setAppSettings(settings);
    await storage.saveAppSettings(settings);
  }, []);

  // Intro management
  const markIntroSeen = useCallback(async () => {
    await storage.setIntroSeen(true);
    setHasSeenIntro(true);
  }, []);

  return {
    mode,
    setMode,
    toggleMode,
    messages,
    addMessage,
    updateLastMessage,
    chatSessions,
    currentSessionId,
    createNewSession,
    selectSession,
    deleteSession,
    clearAllSessions,
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder,
    events,
    addEvent,
    notes,
    addNote,
    deleteNote,
    apiConfig,
    setApiConfig,
    appSettings,
    saveAppSettings,
    isLoading,
    hasSeenIntro,
    markIntroSeen,
  };
}
