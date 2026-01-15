import { useState, useEffect, useCallback } from 'react';
import { AIMode, Message, Reminder, CalendarEvent, APIConfig } from '@/types';
import { storage, secureStorage } from '@/services/storage';
import { aiRouter } from '@/services/ai-router';

export function useAppState() {
  const [mode, setModeState] = useState<AIMode>('emotional');
  const [messages, setMessages] = useState<Message[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [apiConfig, setApiConfigState] = useState<APIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const [savedMode, savedMessages, savedReminders, savedEvents, savedConfig, introSeen] = await Promise.all([
          storage.getMode(),
          storage.getMessages(),
          storage.getReminders(),
          storage.getEvents(),
          secureStorage.getApiConfig(),
          storage.hasSeenIntro(),
        ]);

        setModeState(savedMode);
        setMessages(savedMessages);
        setReminders(savedReminders);
        setEvents(savedEvents);
        setApiConfigState(savedConfig);
        setHasSeenIntro(introSeen);
        
        aiRouter.setMode(savedMode);
        await aiRouter.init();
      } catch (error) {
        console.error('Failed to load state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

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
    return newReminder;
  }, [reminders]);

  const toggleReminder = useCallback(async (id: string) => {
    const updatedReminders = reminders.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    setReminders(updatedReminders);
    await storage.saveReminders(updatedReminders);
  }, [reminders]);

  const deleteReminder = useCallback(async (id: string) => {
    const updatedReminders = reminders.filter(r => r.id !== id);
    setReminders(updatedReminders);
    await storage.saveReminders(updatedReminders);
  }, [reminders]);

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
    apiConfig,
    setApiConfig,
    isLoading,
    hasSeenIntro,
    markIntroSeen,
  };
}
