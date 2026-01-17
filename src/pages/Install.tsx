import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Monitor, Check, ExternalLink, Zap, Shield, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: 'Instant Access', desc: 'Launch MR!JK! directly from home screen' },
    { icon: Shield, title: 'Secure', desc: 'Your data stays private on your device' },
    { icon: Wifi, title: 'Works Offline', desc: 'Basic features available without internet' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Scanline effect */}
      <div className="scanline fixed inset-0 pointer-events-none z-50" />
      
      {/* Background grid */}
      <div className="fixed inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-block mb-4"
            animate={{ 
              boxShadow: [
                '0 0 20px hsl(168 100% 50% / 0.3)',
                '0 0 40px hsl(168 100% 50% / 0.5)',
                '0 0 20px hsl(168 100% 50% / 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
              <span className="font-mono text-2xl font-bold text-primary animate-flicker">MR!JK!</span>
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-mono font-bold text-primary text-glow-cyan mb-2">
            INSTALL MR!JK!
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            // YOUR HACKER COMPANION AWAITS
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 mb-6 border border-primary/20"
        >
          {isInstalled ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-mono font-bold text-primary mb-2">
                INSTALLATION COMPLETE
              </h2>
              <p className="text-muted-foreground font-mono text-sm mb-4">
                MR!JK! is ready on your device
              </p>
              <Button
                onClick={() => navigate('/')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Zap className="w-4 h-4 mr-2" />
                Launch App
              </Button>
            </div>
          ) : deferredPrompt ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse-glow">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-mono font-bold text-primary mb-2">
                READY TO INSTALL
              </h2>
              <p className="text-muted-foreground font-mono text-sm mb-4">
                Click below to add MR!JK! to your home screen
              </p>
              <Button
                onClick={handleInstall}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-glow"
              >
                <Download className="w-5 h-5 mr-2" />
                Install MR!JK!
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {isIOS ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="w-6 h-6 text-primary" />
                    <h2 className="text-lg font-mono font-bold text-primary">
                      iOS INSTALLATION
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <Step num={1} text='Tap the Share button in Safari' icon="↑" />
                    <Step num={2} text='Scroll down and tap "Add to Home Screen"' />
                    <Step num={3} text='Tap "Add" to install MR!JK!' />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Monitor className="w-6 h-6 text-primary" />
                    <h2 className="text-lg font-mono font-bold text-primary">
                      INSTALLATION GUIDE
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <Step num={1} text="Click the install icon in your browser's address bar" />
                    <Step num={2} text='Or click the menu (⋮) and select "Install app"' />
                    <Step num={3} text="Follow the prompts to add MR!JK! to your device" />
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass rounded-lg p-4 border border-border/50 text-center"
            >
              <feature.icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-mono font-bold text-sm text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-xs">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Back to app */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Continue to Web App
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="font-mono text-xs text-muted-foreground">
            // MR!JK! AI ASSISTANT v1.0
          </p>
          <p className="font-mono text-xs text-primary/50 mt-1">
            YOUR PERSONAL HACKER COMPANION
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const Step = ({ num, text, icon }: { num: number; text: string; icon?: string }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
      <span className="font-mono text-sm text-primary font-bold">{icon || num}</span>
    </div>
    <p className="text-foreground font-mono text-sm pt-1">{text}</p>
  </div>
);

export default Install;
