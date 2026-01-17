import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Flag, Clock, Code, User, Briefcase, RefreshCw, CalendarClock } from 'lucide-react';
import { Reminder } from '@/types';
import { format, isToday, isTomorrow } from 'date-fns';

interface RemindersListProps {
  reminders: Reminder[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RemindersList({ reminders, onToggle, onDelete }: RemindersListProps) {
  const sortedReminders = [...reminders].sort((a, b) => 
    a.datetime.getTime() - b.datetime.getTime()
  );

  const getCategoryIcon = (category: Reminder['category']) => {
    switch (category) {
      case 'ctf': return <Flag className="w-4 h-4 text-neon-green" />;
      case 'work': return <Briefcase className="w-4 h-4 text-primary" />;
      case 'personal': return <User className="w-4 h-4 text-secondary" />;
      default: return <Code className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return `Today, ${format(date, 'HH:mm')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'HH:mm')}`;
    return format(date, 'MMM d, HH:mm');
  };

  if (reminders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-mono text-sm">No reminders yet</p>
        <p className="text-xs mt-1">Add one to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {sortedReminders.map((reminder, index) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className={`group glass rounded-lg p-3 transition-all ${
              reminder.completed ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => onToggle(reminder.id)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  reminder.completed 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground/50 hover:border-primary'
                }`}
              >
                {reminder.completed && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryIcon(reminder.category)}
                  <span className={`font-medium truncate ${reminder.completed ? 'line-through' : ''}`}>
                    {reminder.title}
                  </span>
                  {/* Type badge */}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    reminder.type === 'daily' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-secondary/20 text-secondary'
                  }`}>
                    {reminder.type === 'daily' ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        DAILY
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        EVENT
                      </span>
                    )}
                  </span>
                </div>
                
                {reminder.description && (
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {reminder.description}
                  </p>
                )}
                
                <p className="text-xs font-mono text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatDate(reminder.datetime)}
                </p>
              </div>

              {/* Delete button - only for event reminders */}
              {reminder.type === 'event' && (
                <button
                  onClick={() => onDelete(reminder.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
