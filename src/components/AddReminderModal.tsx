import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Flag, Briefcase, User, Code, RefreshCw, Calendar } from 'lucide-react';
import { Reminder, ReminderType } from '@/types';

interface AddReminderModalProps {
  onAdd: (reminder: Omit<Reminder, 'id'>) => void;
  onClose: () => void;
}

export function AddReminderModal({ onAdd, onClose }: AddReminderModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<Reminder['category']>('task');
  const [reminderType, setReminderType] = useState<ReminderType>('event');

  const categories = [
    { id: 'task' as const, icon: Code, label: 'Task', color: 'text-muted-foreground' },
    { id: 'ctf' as const, icon: Flag, label: 'CTF', color: 'text-neon-green' },
    { id: 'work' as const, icon: Briefcase, label: 'Work', color: 'text-primary' },
    { id: 'personal' as const, icon: User, label: 'Personal', color: 'text-secondary' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time) return;
    
    // For daily reminders, use today's date if not specified
    const reminderDate = date || new Date().toISOString().split('T')[0];

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      datetime: new Date(`${reminderDate}T${time}`),
      completed: false,
      category,
      type: reminderType,
    });
    
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-mono">NEW_REMINDER</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reminder Type Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReminderType('event')}
                className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                  reminderType === 'event'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono">EVENT</span>
              </button>
              <button
                type="button"
                onClick={() => setReminderType('daily')}
                className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                  reminderType === 'daily'
                    ? 'border-neon-green bg-neon-green/10'
                    : 'border-border hover:border-neon-green/50'
                }`}
              >
                <RefreshCw className="w-4 h-4 text-neon-green" />
                <span className="text-sm font-mono">DAILY</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {reminderType === 'daily' 
                ? '↻ Resets every day at midnight' 
                : '⚡ Auto-deletes after event time'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to remember?"
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={2}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {reminderType === 'event' && (
              <div>
                <label className="block text-sm font-medium mb-2 font-mono">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  required
                />
              </div>
            )}
            <div className={reminderType === 'daily' ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium mb-2 font-mono">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 font-mono">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                      category === cat.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${cat.color}`} />
                    <span className="text-xs font-mono">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors font-mono"
          >
            <Plus className="w-4 h-4" />
            CREATE_REMINDER
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
