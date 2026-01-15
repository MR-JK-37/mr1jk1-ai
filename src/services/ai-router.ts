// AI Router Service - Routes requests to Lovable AI backend
import { AIMode, Message } from '@/types';

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

class AIRouter {
  private currentMode: AIMode = 'emotional';

  setMode(mode: AIMode): void {
    this.currentMode = mode;
  }

  getMode(): AIMode {
    return this.currentMode;
  }

  async init(): Promise<void> {
    // No initialization needed - Lovable AI is pre-configured
  }

  async sendMessage(message: string, history: Message[]): Promise<AIResponse> {
    try {
      // Convert our message format to API format
      const apiMessages = history.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Add the new user message
      apiMessages.push({ role: 'user', content: message });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: this.currentMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          content: errorData.error || 'An error occurred',
          success: false,
          error: errorData.error,
        };
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      return {
        content: fullContent || 'I received your message but had trouble generating a response.',
        success: true,
      };
    } catch (error) {
      console.error('AI Router error:', error);
      return {
        content: this.getFallbackResponse(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async streamResponse(
    message: string,
    history: Message[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const apiMessages = history.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      apiMessages.push({ role: 'user', content: message });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: this.currentMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') return;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      onChunk(this.getFallbackResponse());
    }
  }

  private getFallbackResponse(): string {
    if (this.currentMode === 'emotional') {
      const responses = [
        "Hey da, I'm having trouble connecting right now, but I'm still here for you! 💕",
        "Kannu, there seems to be a connection issue. Let me try again in a moment...",
        "Sorry da, I couldn't process that. Can you try again?",
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } else {
      return "```\n[ERROR] Connection failed. Retry or check network status.\n```";
    }
  }

  // Auto-detect mode from message tone
  detectMode(message: string): AIMode {
    const technicalKeywords = [
      'code', 'debug', 'hack', 'ctf', 'exploit', 'buffer', 'overflow',
      'sql', 'injection', 'reverse', 'binary', 'terminal', 'command',
      'linux', 'python', 'javascript', 'api', 'server', 'database',
    ];

    const emotionalKeywords = [
      'feel', 'sad', 'happy', 'love', 'miss', 'stressed', 'anxious',
      'tired', 'lonely', 'angry', 'worried', 'scared', 'excited',
    ];

    const lowerMessage = message.toLowerCase();

    const technicalScore = technicalKeywords.filter(k => lowerMessage.includes(k)).length;
    const emotionalScore = emotionalKeywords.filter(k => lowerMessage.includes(k)).length;

    if (technicalScore > emotionalScore) return 'technical';
    if (emotionalScore > technicalScore) return 'emotional';
    return this.currentMode;
  }

  validateApiKey(): Promise<boolean> {
    // Always valid with Lovable AI
    return Promise.resolve(true);
  }
}

export const aiRouter = new AIRouter();
