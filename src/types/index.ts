export type AIMode = 'emotional' | 'technical';

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
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
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
  apiConfig: APIConfig;
  isListening: boolean;
  isSpeaking: boolean;
}
