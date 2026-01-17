import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Monitor, Check, ExternalLink, Zap, Shield, Wifi, Share2, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check platform
    const userAgent = navigator.userAgent.toLowerCase();
    const iOS = /ipad|iphone|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    setIsIOS(iOS);
    setIsAndroid(android);

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

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDownloadAPK = () => {
    window.open(APP_CONFIG.APK_DOWNLOAD_URL, '_blank');
  };

  const features = [
    { icon: Zap, title: 'Instant Access', desc: 'Launch MR!JK! directly from home screen' },
    { icon: Shield, title: 'Full Features', desc: 'Native notifications & offline support' },
    { icon: Wifi, title: 'Always Ready', desc: 'Works even without internet' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Scanline effect */}
      <div className="scanline fixed inset-0 pointer-events-none z-50" />
      
      {/* Animated background */}
      <div className="fixed inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 50% 0%, hsl(205 100% 55% / 0.15) 0%, transparent 50%),
              linear-gradient(hsl(205 100% 55% / 0.05) 1px, transparent 1px),
              linear-gradient(90deg, hsl(205 100% 55% / 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 50px 50px, 50px 50px'
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
                '0 0 20px hsl(205 100% 55% / 0.3)',
                '0 0 40px hsl(205 100% 55% / 0.5)',
                '0 0 20px hsl(205 100% 55% / 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center glass-glossy">
              <span className="font-mono text-2xl font-bold text-primary animate-flicker">MR!JK!</span>
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-mono font-bold text-primary text-glow-blue mb-2">
            GET MR!JK!
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            // YOUR HACKER COMPANION
          </p>
        </motion.div>

        {/* Already Installed */}
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-glossy rounded-xl p-6 mb-6 border border-primary/30"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse-glow">
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
                className="btn-glossy bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Zap className="w-4 h-4 mr-2" />
                Launch App
              </Button>
            </div>
          </motion.div>
        )}

        {/* Primary: APK Download (Android) */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-glossy rounded-xl p-6 mb-4 border border-primary/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-glow-intense">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-mono font-bold text-primary">
                  ANDROID APP
                </h2>
                <p className="text-xs text-muted-foreground">
                  Direct APK download • Full native features
                </p>
              </div>
            </div>
            
            <p className="text-sm text-foreground/80 mb-4 font-mono">
              Download the Android app (APK) for the best experience with full notifications and offline support.
            </p>
            
            <Button
              onClick={handleDownloadAPK}
              size="lg"
              className="w-full btn-glossy bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 animate-pulse-glow-intense font-mono text-base"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Android App (.APK)
            </Button>
            
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground font-mono">
                <span className="text-primary">TIP:</span> After download, tap the APK file to install.
                You may need to allow installation from unknown sources in your device settings.
              </p>
            </div>
          </motion.div>
        )}

        {/* Secondary: PWA Install */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-5 mb-6 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              {isIOS ? (
                <Share2 className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Chrome className="w-5 h-5 text-muted-foreground" />
              )}
              <h3 className="font-mono font-semibold text-foreground/80 text-sm">
                ALTERNATIVE: BROWSER INSTALL
              </h3>
            </div>

            {deferredPrompt ? (
              <Button
                onClick={handleInstallPWA}
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Install as Web App
              </Button>
            ) : isIOS ? (
              <div className="space-y-3">
                <Step num={1} text='Tap the Share button in Safari' icon="↑" />
                <Step num={2} text='Scroll and tap "Add to Home Screen"' />
                <Step num={3} text='Tap "Add" to install' />
              </div>
            ) : (
              <div className="space-y-3">
                <Step num={1} text="Tap the menu icon (⋮) in your browser" />
                <Step num={2} text='Select "Install app" or "Add to Home Screen"' />
                <Step num={3} text="Follow the prompts to install" />
              </div>
            )}
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass rounded-lg p-4 border border-border/50 text-center hover:border-primary/30 transition-all"
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
          transition={{ delay: 0.7 }}
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
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="font-mono text-xs text-muted-foreground">
            // MR!JK! AI ASSISTANT v{APP_CONFIG.APP_VERSION}
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
    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
      <span className="font-mono text-xs text-primary font-bold">{icon || num}</span>
    </div>
    <p className="text-foreground/80 font-mono text-sm pt-0.5">{text}</p>
  </div>
);

export default Install;
