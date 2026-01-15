// Voice service using ElevenLabs for TTS and STT
import { supabase } from '@/integrations/supabase/client';
import { AIMode } from '@/types';

export interface VoiceService {
  speak(text: string, mode: AIMode): Promise<void>;
  startListening(onResult: (text: string) => void, onError?: (error: Error) => void): Promise<void>;
  stopListening(): void;
  isListening: boolean;
  isSpeaking: boolean;
}

class VoiceServiceImpl implements VoiceService {
  private audio: HTMLAudioElement | null = null;
  private recognition: any = null;
  public isListening = false;
  public isSpeaking = false;

  async speak(text: string, mode: AIMode): Promise<void> {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    try {
      this.isSpeaking = true;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, mode }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Use data URI for base64 audio
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      this.audio = new Audio(audioUrl);
      
      this.audio.onended = () => {
        this.isSpeaking = false;
      };
      
      this.audio.onerror = () => {
        this.isSpeaking = false;
      };

      await this.audio.play();
    } catch (error) {
      this.isSpeaking = false;
      console.error('TTS error:', error);
      throw error;
    }
  }

  stopSpeaking(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.isSpeaking = false;
  }

  async startListening(
    onResult: (text: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    // Use Web Speech API as fallback (works in most browsers)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const error = new Error('Speech recognition not supported in this browser');
      onError?.(error);
      throw error;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        onError?.(new Error(event.error));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      this.isListening = false;
      throw error;
    }
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isListening = false;
  }
}

export const voiceService = new VoiceServiceImpl();

// Add Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
