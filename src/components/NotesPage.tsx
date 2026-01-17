import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { Note } from '@/types';
import { format } from 'date-fns';

interface NotesPageProps {
  notes: Note[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesPage({ notes, onAddNote, onDeleteNote }: NotesPageProps) {
  const [newNote, setNewNote] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote.trim());
    setNewNote('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 max-w-lg mx-auto space-y-4"
    >
      {/* Header */}
      <div className="glass-glossy rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-lg text-primary text-glow-blue">
              // HACKER DIARY
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              MR!JK! PRIVATE LOGS
            </p>
          </div>
        </div>
      </div>

      {/* New Note Input */}
      <form onSubmit={handleSubmit} className="glass rounded-xl p-4">
        <div className="font-mono text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <span className="text-primary">$</span>
          <span>new_entry.log</span>
          <span className={`w-2 h-4 bg-primary ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
        </div>
        <textarea
          ref={textareaRef}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write your thoughts, MR!JK!..."
          rows={3}
          className="w-full bg-transparent border-none resize-none font-mono text-primary focus:outline-none placeholder:text-muted-foreground/50"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            SAVE LOG
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-6 text-center"
            >
              <p className="font-mono text-muted-foreground text-sm">
                // NO LOGS FOUND
              </p>
              <p className="font-mono text-xs text-muted-foreground/50 mt-1">
                Start documenting your journey, MR!JK!
              </p>
            </motion.div>
          ) : (
            notes.map((note, index) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-4 group hover:border-primary/30 border border-transparent transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-primary mb-2 flex items-center gap-2">
                      <span className="text-primary">&gt;</span>
                      <span>{format(new Date(note.timestamp), 'yyyy-MM-dd HH:mm:ss')}</span>
                    </div>
                    <p className="font-mono text-sm text-foreground/90 whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      {notes.length > 0 && (
        <div className="glass rounded-xl p-3 font-mono text-xs text-muted-foreground flex justify-between">
          <span>TOTAL LOGS: {notes.length}</span>
          <span>ENCRYPTED: YES</span>
        </div>
      )}
    </motion.div>
  );
}
