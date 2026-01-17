import { motion } from 'framer-motion';
import { Heart, Terminal } from 'lucide-react';
import { AIMode } from '@/types';

interface ModeSwitcherProps {
  mode: AIMode;
  onToggle: () => void;
}

export function ModeSwitcher({ mode, onToggle }: ModeSwitcherProps) {
  const isEmotional = mode === 'emotional';

  return (
    <motion.button
      onClick={onToggle}
      className="relative w-20 h-10 rounded-full p-1 transition-colors duration-300"
      style={{
        background: isEmotional 
          ? 'linear-gradient(135deg, hsl(340 80% 65% / 0.3), hsl(280 80% 60% / 0.3))'
          : 'linear-gradient(135deg, hsl(205 100% 55% / 0.3), hsl(185 100% 50% / 0.3))',
        border: `1px solid ${isEmotional ? 'hsl(340 80% 65% / 0.5)' : 'hsl(205 100% 55% / 0.5)'}`,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-1 w-8 h-8 rounded-full flex items-center justify-center"
        animate={{
          left: isEmotional ? '4px' : 'calc(100% - 36px)',
          backgroundColor: isEmotional ? 'hsl(340 80% 65%)' : 'hsl(205 100% 55%)',
          boxShadow: isEmotional 
            ? '0 0 15px hsl(340 80% 65% / 0.5)' 
            : '0 0 15px hsl(205 100% 55% / 0.5)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isEmotional ? 0 : 360 }}
          transition={{ duration: 0.3 }}
        >
          {isEmotional ? (
            <Heart className="w-4 h-4 text-background" />
          ) : (
            <Terminal className="w-4 h-4 text-background" />
          )}
        </motion.div>
      </motion.div>
    </motion.button>
  );
}

export function ModeIndicator({ mode }: { mode: AIMode }) {
  const isEmotional = mode === 'emotional';
  
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs"
      animate={{
        backgroundColor: isEmotional ? 'hsl(340 80% 65% / 0.15)' : 'hsl(205 100% 55% / 0.15)',
        borderColor: isEmotional ? 'hsl(340 80% 65% / 0.3)' : 'hsl(205 100% 55% / 0.3)',
      }}
      style={{ border: '1px solid' }}
    >
      {isEmotional ? (
        <>
          <Heart className="w-3 h-3 text-secondary" />
          <span className="text-secondary">EMOTIONAL</span>
        </>
      ) : (
        <>
          <Terminal className="w-3 h-3 text-primary" />
          <span className="text-primary">TECHNICAL</span>
        </>
      )}
    </motion.div>
  );
}
