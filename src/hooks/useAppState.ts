import { useState, useEffect, useCallback, useRef } from 'react';
import { AIMode, Message, Reminder, CalendarEvent, APIConfig, Note } from '@/types';
import { storage, secureStorage } from '@/services/storage';
import { aiRouter } from '@/services/ai-router';
import { notificationService } from '@/services/notifications';

export function useAppState() {
  const [mode, setModeState] = useState<AIMode>('emotional');
  const [messages, setMessages] = useState<Message[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [apiConfig, setApiConfigState] = useState<APIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  
  const dailyResetInterval = useRef<number | null>(null);

  // Check and reset daily reminders at midnight
  const checkDailyReset = useCallback(async (currentReminders: Reminder[]) => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = await storage.getLastDailyReset();

    if (lastReset !== today) {
      // It's a new day - reset daily reminders
      const updatedReminders = currentReminders.map(r => {
        if (r.type === 'daily') {
          // Reset to today with same time
          const newDatetime = new Date(r.datetime);
          const now = new Date();
          newDatetime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
          
          return { ...r, completed: false, datetime: newDatetime };
        }
        return r;
      });

      // Remove expired event reminders
      const now = new Date();
      const filteredReminders = updatedReminders.filter(r => {
        if (r.type === 'event' && new Date(r.datetime) < now) {
          // Auto-delete expired events
          notificationService.cancelReminder(r.id);
          return false;
        }
        return true;
      });

      setReminders(filteredReminders);
      await storage.saveReminders(filteredReminders);
      await storage.setLastDailyReset(today);

      // Reschedule daily reminders
      for (const reminder of filteredReminders.filter(r => r.type === 'daily' && !r.completed)) {
        await notificationService.rescheduleDaily(reminder);
      }
    }
  }, []);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const [savedMode, savedMessages, savedReminders, savedEvents, savedNotes, savedConfig, introSeen] = await Promise.all([
          storage.getMode(),
          storage.getMessages(),
          storage.getReminders(),
          storage.getEvents(),
          storage.getNotes(),
          secureStorage.getApiConfig(),
          storage.hasSeenIntro(),
        ]);

        setModeState(savedMode);
        setMessages(savedMessages);
        setReminders(savedReminders);
        setEvents(savedEvents);
        setNotes(savedNotes);
        setApiConfigState(savedConfig);
        setHasSeenIntro(introSeen);
        
        aiRouter.setMode(savedMode);
        await aiRouter.init();

        // Request notification permission
        await notificationService.requestPermission();

        // Check for daily reset
        await checkDailyReset(savedReminders);

        // Schedule notifications for existing reminders
        for (const reminder of savedReminders.filter(r => !r.completed)) {
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

    // Set up midnight check interval
    const checkMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      dailyResetInterval.current = window.setTimeout(async () => {
        const currentReminders = await storage.getReminders();
        await checkDailyReset(currentReminders);
        checkMidnight(); // Reschedule for next midnight
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

  // Message management
  const addMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await storage.saveMessages(updatedMessages);
    return newMessage;
  }, [messages]);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    await storage.saveMessages([]);
  }, []);

  // Reminder management
  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
    };
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await storage.saveReminders(updatedReminders);
    
    // Schedule notification
    await notificationService.scheduleReminder(newReminder);
    
    return newReminder;
  }, [reminders]);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    // Daily reminders can be completed but not deleted
    const updatedReminders = reminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    setReminders(updatedReminders);
    await storage.saveReminders(updatedReminders);
    
    // Cancel notification if completed
    if (!reminder.completed) {
      await notificationService.cancelReminder(id);
    } else if (reminder.type === 'daily') {
      // Reschedule daily reminder for tomorrow if uncompleted
      await notificationService.rescheduleDaily({ ...reminder, completed: false });
    }
  }, [reminders]);

  const deleteReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    // Prevent deletion of daily reminders
    if (reminder.type === 'daily') {
      console.warn('Daily reminders cannot be deleted');
      return;
    }

    const updatedReminders = reminders.filter(r => r.id !== id);
    setReminders(updatedReminders);
    await storage.saveReminders(updatedReminders);
    
    // Cancel notification
    await notificationService.cancelReminder(id);
  }, [reminders]);

  // Notes management
  const addNote = useCallback(async (content: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date(),
    };
    const updatedNotes = [newNote, ...notes]; // Newest first
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

  // API Config management
  const setApiConfig = useCallback(async (config: APIConfig) => {
    await secureStorage.setApiConfig(config);
    setApiConfigState(config);
    await aiRouter.init();
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
    clearMessages,
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
    isLoading,
    hasSeenIntro,
    markIntroSeen,
  };
}
