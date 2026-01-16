export type AIMode = 'emotional' | 'technical';

export type ReminderType = 'daily' | 'event';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode: AIMode;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'video' | 'file';
  url: string;
  size: number;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  datetime: Date;
  completed: boolean;
  category: 'task' | 'ctf' | 'personal' | 'work';
  type: ReminderType; // 'daily' auto-resets, 'event' auto-deletes
  notificationId?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  label?: 'CTF' | 'MISSION' | 'TASK';
}

export interface Note {
  id: string;
  content: string;
  timestamp: Date;
}

export interface APIConfig {
  emotionalApiKey: string;
  technicalApiKey: string;
  emotionalEndpoint?: string;
  technicalEndpoint?: string;
}

export interface AppState {
  mode: AIMode;
  messages: Message[];
  reminders: Reminder[];
  events: CalendarEvent[];
  notes: Note[];
  apiConfig: APIConfig;
  isListening: boolean;
  isSpeaking: boolean;
}
