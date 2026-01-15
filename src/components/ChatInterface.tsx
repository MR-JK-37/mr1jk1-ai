import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, MicOff, X, Image, FileText, Film } from 'lucide-react';
import { Message, AIMode, Attachment } from '@/types';
import { ModeIndicator } from './ModeSwitcher';
import { aiRouter } from '@/services/ai-router';

interface ChatInterfaceProps {
  mode: AIMode;
  messages: Message[];
  onSendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
}

export function ChatInterface({ mode, messages, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    
    setIsLoading(true);
    try {
      await onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' 
           : file.type === 'application/pdf' ? 'pdf'
           : file.type.startsWith('video/') ? 'video' 
           : 'file',
      url: URL.createObjectURL(file),
      size: file.size,
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const toggleListening = () => {
    // Placeholder for voice recognition
    setIsListening(!isListening);
  };

  const getAttachmentIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'video': return <Film className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const isEmotional = mode === 'emotional';

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center p-8"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isEmotional ? 'bg-secondary/20' : 'bg-primary/20'
            }`}>
              {isEmotional ? '💕' : '💻'}
            </div>
            <h3 className="text-lg font-medium mb-2">
              {isEmotional ? 'Hey there, kannu! 💖' : 'Ready for action, Mr. JK'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {isEmotional 
                ? "I'm here whenever you need to talk, da. What's on your mind?"
                : "System initialized. Awaiting your commands. Let's hack the planet."}
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary/20 border border-primary/30 text-foreground'
                    : message.mode === 'emotional'
                    ? 'bg-secondary/20 border border-secondary/30 text-foreground'
                    : 'bg-muted border border-border text-foreground'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <ModeIndicator mode={message.mode} />
                  </div>
                )}
                
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-1 text-xs bg-background/50 px-2 py-1 rounded">
                        {getAttachmentIcon(att.type)}
                        <span className="truncate max-w-[100px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className={`whitespace-pre-wrap ${message.mode === 'technical' ? 'font-mono text-sm' : ''}`}>
                  {message.content}
                </p>
                
                <p className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-muted rounded-2xl px-4 py-3 border border-border">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-muted-foreground font-mono text-sm"
                >
                  {isEmotional ? 'Thinking...' : 'Processing...'}
                </motion.span>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className={`w-2 h-2 rounded-full ${isEmotional ? 'bg-secondary' : 'bg-primary'}`}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-t border-border"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map(att => (
                <div key={att.id} className="relative group">
                  {att.type === 'image' ? (
                    <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg flex flex-col items-center justify-center">
                      {getAttachmentIcon(att.type)}
                      <span className="text-xs text-muted-foreground mt-1 truncate w-14 text-center">
                        {att.name.split('.').pop()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          {/* Voice input */}
          <motion.button
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-colors ${
              isListening 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isEmotional ? "Tell me what's on your mind..." : "Enter command..."}
              rows={1}
              className={`w-full px-4 py-3 bg-muted border border-border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all ${
                isEmotional ? 'focus:ring-secondary/50' : 'focus:ring-primary/50'
              } ${mode === 'technical' ? 'font-mono' : ''}`}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          {/* Send button */}
          <motion.button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className={`p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isEmotional 
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
