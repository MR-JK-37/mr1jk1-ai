import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Flag, Briefcase, User, Code } from 'lucide-react';
import { Reminder } from '@/types';

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

  const categories = [
    { id: 'task' as const, icon: Code, label: 'Task', color: 'text-muted-foreground' },
    { id: 'ctf' as const, icon: Flag, label: 'CTF', color: 'text-neon-green' },
    { id: 'work' as const, icon: Briefcase, label: 'Work', color: 'text-primary' },
    { id: 'personal' as const, icon: User, label: 'Personal', color: 'text-secondary' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      datetime: new Date(`${date}T${time}`),
      completed: false,
      category,
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
          <h2 className="text-xl font-bold">New Reminder</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to remember?"
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={2}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
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
                    <span className="text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
