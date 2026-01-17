import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroScreenProps {
  onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [phase, setPhase] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    // Cursor blink
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    // Phase transitions
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
    ];

    return () => {
      clearInterval(cursorInterval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-background flex items-center justify-center overflow-hidden scanline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => phase >= 3 && onComplete()}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--neon-blue) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--neon-blue) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Radial glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(205 100% 55% / 0.3) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          animate={{
            top: ['0%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 text-center px-8">
        <AnimatePresence mode="wait">
          {/* Terminal prompt */}
          {phase >= 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-muted-foreground text-sm mb-8"
            >
              <span className="text-primary">root@jk-system</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-secondary">~</span>
              <span className="text-muted-foreground">$ </span>
              <span className="text-foreground">./initialize.sh</span>
            </motion.div>
          )}

          {/* Main welcome text */}
          {phase >= 1 && (
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-bold font-mono mb-4 animate-flicker"
            >
              <span className="text-glow-blue text-primary">Welcome</span>
              <br />
              <span className="text-glow-cyan text-secondary">MR!JK!</span>
            </motion.h1>
          )}

          {/* Subtitle */}
          {phase >= 2 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-muted-foreground text-lg mb-8"
            >
              <span className="animate-glitch inline-block">
                [ SYSTEM INITIALIZED ]
              </span>
            </motion.p>
          )}

          {/* Continue prompt */}
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-12"
            >
              <motion.button
                onClick={onComplete}
                className="group relative px-8 py-4 font-mono text-primary border border-primary/50 rounded-lg overflow-hidden transition-all hover:border-primary animate-pulse-glow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="text-muted-foreground">&gt;</span>
                  TAP TO CONTINUE
                  <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>_</span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              
              <p className="mt-6 text-muted-foreground/50 text-sm font-mono">
                v1.0.0 | Your Personal AI Companion
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/30" />
    </motion.div>
  );
}
