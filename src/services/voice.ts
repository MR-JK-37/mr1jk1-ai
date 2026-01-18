// Voice service using ElevenLabs for TTS and Web Speech API for STT
import { AIMode, VoiceSettings } from '@/types';

export interface VoiceService {
  speak(text: string, mode: AIMode, settings?: VoiceSettings): Promise<void>;
  startListening(onResult: (text: string) => void, onError?: (error: Error) => void): Promise<void>;
  stopListening(): void;
  stopSpeaking(): void;
  isListening: boolean;
  isSpeaking: boolean;
}

class VoiceServiceImpl implements VoiceService {
  private audio: HTMLAudioElement | null = null;
  private recognition: any = null;
  public isListening = false;
  public isSpeaking = false;

  async speak(text: string, mode: AIMode, settings?: VoiceSettings): Promise<void> {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    // Check if voice is disabled
    if (settings && !settings.enabled) {
      return;
    }

    try {
      this.isSpeaking = true;

      // Try ElevenLabs first
      const success = await this.speakWithElevenLabs(text, mode, settings);
      
      if (!success) {
        // Fallback to Web Speech API
        await this.speakWithWebSpeech(text, settings);
      }
    } catch (error) {
      console.error('TTS error:', error);
      // Try Web Speech fallback
      try {
        await this.speakWithWebSpeech(text, settings);
      } catch (fallbackError) {
        console.error('Web Speech fallback failed:', fallbackError);
        this.isSpeaking = false;
        throw error;
      }
    }
  }

  private async speakWithElevenLabs(text: string, mode: AIMode, settings?: VoiceSettings): Promise<boolean> {
    try {
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
        console.warn('ElevenLabs TTS failed, status:', response.status);
        return false;
      }

      const data = await response.json();
      
      if (data.error) {
        console.warn('ElevenLabs TTS error:', data.error);
        return false;
      }

      // Use data URI for base64 audio
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      this.audio = new Audio(audioUrl);
      
      // Apply volume setting
      if (settings?.volume !== undefined) {
        this.audio.volume = settings.volume;
      }
      
      // Apply playback rate based on speed setting
      if (settings?.speed) {
        switch (settings.speed) {
          case 'slow':
            this.audio.playbackRate = 0.8;
            break;
          case 'fast':
            this.audio.playbackRate = 1.2;
            break;
          default:
            this.audio.playbackRate = 1.0;
        }
      }

      return new Promise((resolve) => {
        this.audio!.onended = () => {
          this.isSpeaking = false;
          resolve(true);
        };
        
        this.audio!.onerror = () => {
          this.isSpeaking = false;
          resolve(false);
        };

        this.audio!.play().catch(() => {
          this.isSpeaking = false;
          resolve(false);
        });
      });
    } catch (error) {
      console.warn('ElevenLabs TTS exception:', error);
      return false;
    }
  }

  private async speakWithWebSpeech(text: string, settings?: VoiceSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices and prefer a female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('karen')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      // Apply settings
      if (settings?.volume !== undefined) {
        utterance.volume = settings.volume;
      }
      
      if (settings?.speed) {
        switch (settings.speed) {
          case 'slow':
            utterance.rate = 0.8;
            break;
          case 'fast':
            utterance.rate = 1.3;
            break;
          default:
            utterance.rate = 1.0;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(new Error(event.error));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  async startListening(
    onResult: (text: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    // Use Web Speech API
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

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      this.recognition.onerror = (event: any) => {
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
