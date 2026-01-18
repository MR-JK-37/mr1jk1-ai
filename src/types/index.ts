export type AIMode = 'emotional' | 'technical';

export type ReminderType = 'daily' | 'event';

export type ResponseLength = 'concise' | 'balanced' | 'detailed';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode: AIMode;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  mode: AIMode;
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

export interface VoiceSettings {
  enabled: boolean;
  volume: number; // 0-1
  speed: 'slow' | 'normal' | 'fast';
  autoSpeak: boolean;
}

export interface APIConfig {
  emotionalApiKey: string;
  technicalApiKey: string;
  emotionalEndpoint?: string;
  technicalEndpoint?: string;
}

export interface AppSettings {
  voiceSettings: VoiceSettings;
  responseLength: ResponseLength;
}

export interface AppState {
  mode: AIMode;
  messages: Message[];
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  reminders: Reminder[];
  events: CalendarEvent[];
  notes: Note[];
  apiConfig: APIConfig;
  settings: AppSettings;
  isListening: boolean;
  isSpeaking: boolean;
}
