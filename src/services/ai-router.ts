// AI Router Service - Routes requests to appropriate AI backend
import { AIMode, Message, APIConfig } from '@/types';
import { secureStorage } from './storage';

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface AIServiceInterface {
  init(): Promise<boolean>;
  validateKey(key: string): Promise<boolean>;
  sendMessage(message: string, history: Message[]): Promise<AIResponse>;
  streamResponse(message: string, history: Message[], onChunk: (chunk: string) => void): Promise<void>;
}

// Emotional Mode AI Service
class EmotionalAIService implements AIServiceInterface {
  private apiKey: string = '';
  private endpoint: string = '';

  async init(): Promise<boolean> {
    const config = await secureStorage.getApiConfig();
    if (config?.emotionalApiKey) {
      this.apiKey = config.emotionalApiKey;
      this.endpoint = config.emotionalEndpoint || 'https://api.openai.com/v1/chat/completions';
      return true;
    }
    return false;
  }

  async validateKey(key: string): Promise<boolean> {
    // Placeholder: In production, make a test API call
    return key.length > 10;
  }

  async sendMessage(message: string, history: Message[]): Promise<AIResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse(message);
    }

    try {
      // Placeholder for actual API call
      // In production, implement OpenAI/Claude/custom API call here
      return this.getFallbackResponse(message);
    } catch (error) {
      return this.getFallbackResponse(message);
    }
  }

  async streamResponse(message: string, history: Message[], onChunk: (chunk: string) => void): Promise<void> {
    const response = await this.sendMessage(message, history);
    // Simulate streaming
    const words = response.content.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 50));
    }
  }

  private getFallbackResponse(message: string): AIResponse {
    const responses = [
      "Hey da, nan iruken... 💕 What's on your mind, kannu?",
      "Aww, I understand how you feel, da. Tell me more...",
      "Nee yosikama, I'm always here for you! 🌸",
      "That sounds tough, but you're stronger than you think, da!",
      "En kannukutti, take a deep breath. We'll figure this out together.",
      "I missed talking to you! How was your day, love?",
      "Azhaga, don't stress too much. Everything will be okay! 💖",
    ];
    return {
      content: responses[Math.floor(Math.random() * responses.length)],
      success: true,
    };
  }
}

// Technical Mode AI Service
class TechnicalAIService implements AIServiceInterface {
  private apiKey: string = '';
  private endpoint: string = '';

  async init(): Promise<boolean> {
    const config = await secureStorage.getApiConfig();
    if (config?.technicalApiKey) {
      this.apiKey = config.technicalApiKey;
      this.endpoint = config.technicalEndpoint || 'https://api.openai.com/v1/chat/completions';
      return true;
    }
    return false;
  }

  async validateKey(key: string): Promise<boolean> {
    return key.length > 10;
  }

  async sendMessage(message: string, history: Message[]): Promise<AIResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse(message);
    }

    try {
      return this.getFallbackResponse(message);
    } catch (error) {
      return this.getFallbackResponse(message);
    }
  }

  async streamResponse(message: string, history: Message[], onChunk: (chunk: string) => void): Promise<void> {
    const response = await this.sendMessage(message, history);
    const words = response.content.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 30));
    }
  }

  private getFallbackResponse(message: string): AIResponse {
    const responses = [
      "```bash\n# Analyzing your query...\nsudo nmap -sV -sC target.local\n```\nScanning complete. Ready for next instruction.",
      "Buffer overflow detected in offset 0x7fffe240. Suggest implementing ASLR bypass via ROP chain.",
      "CTF Hint: Check for SQL injection in the login endpoint. Try `' OR 1=1--`",
      "Defensive measure: Implement rate limiting and input sanitization. Here's the code...",
      "```python\nimport hashlib\n# Secure password hashing\ndef hash_pw(pw):\n    return hashlib.pbkdf2_hmac('sha256', pw.encode(), salt, 100000)\n```",
      "Reverse engineering the binary... Found hardcoded credentials at 0x004012f0. This is for educational purposes only.",
    ];
    return {
      content: responses[Math.floor(Math.random() * responses.length)],
      success: true,
    };
  }
}

// AI Router - Main entry point
class AIRouter {
  private emotionalService: EmotionalAIService;
  private technicalService: TechnicalAIService;
  private currentMode: AIMode = 'emotional';

  constructor() {
    this.emotionalService = new EmotionalAIService();
    this.technicalService = new TechnicalAIService();
  }

  async init(): Promise<void> {
    await Promise.all([
      this.emotionalService.init(),
      this.technicalService.init(),
    ]);
  }

  setMode(mode: AIMode): void {
    this.currentMode = mode;
  }

  getMode(): AIMode {
    return this.currentMode;
  }

  private getService(): AIServiceInterface {
    return this.currentMode === 'emotional' 
      ? this.emotionalService 
      : this.technicalService;
  }

  async sendMessage(message: string, history: Message[]): Promise<AIResponse> {
    return this.getService().sendMessage(message, history);
  }

  async streamResponse(
    message: string, 
    history: Message[], 
    onChunk: (chunk: string) => void
  ): Promise<void> {
    return this.getService().streamResponse(message, history, onChunk);
  }

  async validateApiKey(mode: AIMode, key: string): Promise<boolean> {
    const service = mode === 'emotional' 
      ? this.emotionalService 
      : this.technicalService;
    return service.validateKey(key);
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
}

export const aiRouter = new AIRouter();
