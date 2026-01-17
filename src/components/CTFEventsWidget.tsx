import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ExternalLink, Plus, AlertCircle, RefreshCw, Trophy, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reminder } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';

interface CTFEvent {
  id: number;
  title: string;
  url: string;
  ctftime_url: string;
  start: string;
  finish: string;
  duration: { hours: number; days: number };
  format: string;
  format_id: number;
  onsite: boolean;
  weight: number;
  organizers: { id: number; name: string }[];
  logo: string;
}

interface CTFEventsWidgetProps {
  onAddReminder: (reminder: Omit<Reminder, 'id'>) => Promise<Reminder>;
}

export const CTFEventsWidget = ({ onAddReminder }: CTFEventsWidgetProps) => {
  const [events, setEvents] = useState<CTFEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedReminders, setAddedReminders] = useState<Set<number>>(new Set());
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch upcoming events from CTFTime API
      const now = Math.floor(Date.now() / 1000);
      const oneMonthLater = now + (30 * 24 * 60 * 60);
      
      // Use a CORS proxy since CTFTime doesn't support CORS
      const response = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(
          `https://ctftime.org/api/v1/events/?limit=10&start=${now}&finish=${oneMonthLater}`
        )}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch CTF events');
      }
      
      const data = await response.json();
      const parsedEvents: CTFEvent[] = JSON.parse(data.contents);
      
      // Filter only upcoming events
      const upcomingEvents = parsedEvents.filter(event => 
        new Date(event.start) > new Date()
      );
      
      setEvents(upcomingEvents);
      setLastFetch(new Date());
    } catch (err) {
      console.error('CTF fetch error:', err);
      setError('Unable to load CTF events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    
    // Auto-refresh every 2 hours
    const interval = setInterval(fetchEvents, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleAddReminder = async (event: CTFEvent) => {
    if (addedReminders.has(event.id)) return;
    
    const startDate = new Date(event.start);
    
    await onAddReminder({
      title: `CTF: ${event.title}`,
      description: `Format: ${event.format} | Duration: ${event.duration.days}d ${event.duration.hours}h`,
      datetime: startDate,
      completed: false,
      category: 'ctf',
      type: 'event',
    });
    
    setAddedReminders(prev => new Set([...prev, event.id]));
  };

  const getFormatIcon = (format: string) => {
    if (format.toLowerCase().includes('jeopardy')) return Trophy;
    if (format.toLowerCase().includes('attack')) return Shield;
    return Trophy;
  };

  const formatDuration = (duration: { hours: number; days: number }) => {
    if (duration.days > 0) {
      return `${duration.days}d ${duration.hours % 24}h`;
    }
    return `${duration.hours}h`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-glossy rounded-xl p-5 border border-primary/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-foreground">
              LIVE CTF EVENTS
            </h3>
            <p className="text-xs text-muted-foreground">
              {lastFetch ? `Updated ${formatDistanceToNow(lastFetch, { addSuffix: true })}` : 'Loading...'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchEvents}
          disabled={loading}
          className="text-muted-foreground hover:text-primary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchEvents}
              className="mt-2 text-primary"
            >
              Try Again
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming CTF events</p>
          </div>
        ) : (
          <AnimatePresence>
            {events.map((event, index) => {
              const FormatIcon = getFormatIcon(event.format);
              const isAdded = addedReminders.has(event.id);
              const startDate = new Date(event.start);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FormatIcon className="w-4 h-4 text-primary flex-shrink-0" />
                        <h4 className="font-mono font-semibold text-sm text-foreground truncate">
                          {event.title}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(startDate, 'MMM dd, HH:mm')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(event.duration)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                          {event.format}
                        </span>
                      </div>
                      
                      {event.weight > 0 && (
                        <span className="inline-block mt-1 text-xs text-primary/70">
                          Weight: {event.weight.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(event.ctftime_url, '_blank')}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={isAdded ? "default" : "ghost"}
                        size="icon"
                        onClick={() => handleAddReminder(event)}
                        disabled={isAdded}
                        className={`h-8 w-8 ${isAdded ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      >
                        <Plus className={`w-4 h-4 ${isAdded ? 'opacity-50' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center font-mono">
          // Data from CTFTime.org
        </p>
      </div>
    </motion.div>
  );
};
