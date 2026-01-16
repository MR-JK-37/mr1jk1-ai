import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function HackerClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  
  const day = time.toLocaleDateString('en-US', { weekday: 'long' });
  const date = time.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric' 
  });

  return (
    <motion.div 
      className="glass rounded-xl p-6 text-center relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <motion.div
          className="absolute left-0 right-0 h-px bg-primary"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Header */}
      <div className="font-mono text-xs text-muted-foreground mb-4 flex items-center justify-center gap-2">
        <span className="text-primary">$</span>
        <span>SYSTEM_TIME // IST</span>
      </div>

      {/* Time display */}
      <div className="font-mono text-5xl md:text-6xl font-bold tracking-wider mb-2">
        <span className="text-primary text-glow-cyan">{hours}</span>
        <motion.span 
          className="text-muted-foreground mx-1"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          :
        </motion.span>
        <span className="text-primary text-glow-cyan">{minutes}</span>
        <motion.span 
          className="text-muted-foreground mx-1"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          :
        </motion.span>
        <motion.span 
          className="text-secondary text-glow-pink text-3xl md:text-4xl"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {seconds}
        </motion.span>
      </div>

      {/* Date display */}
      <div className="mt-4 space-y-1">
        <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
          {day}
        </p>
        <p className="text-foreground/80 font-mono text-lg">
          {date}
        </p>
      </div>

      {/* Status bar */}
      <div className="mt-4 pt-4 border-t border-border/50 flex justify-center gap-4 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          ONLINE
        </span>
        <span className="text-border">|</span>
        <span>SYS: OK</span>
        <span className="text-border">|</span>
        <span className="text-primary">MR!JK!</span>
      </div>
    </motion.div>
  );
}
