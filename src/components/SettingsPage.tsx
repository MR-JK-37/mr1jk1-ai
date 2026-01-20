import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Shield, Save, Trash2, Volume2, VolumeX, Bell, BellOff, 
  Check, AlertTriangle, MessageSquare, Gauge, TestTube, Play
} from 'lucide-react';
import { APIConfig, AppSettings, ResponseLength } from '@/types';
import { notificationService } from '@/services/notifications';
import { toast } from 'sonner';

interface SettingsPageProps {
  apiConfig: APIConfig | null;
  appSettings: AppSettings;
  onSaveApiConfig: (config: APIConfig) => Promise<void>;
  onSaveAppSettings: (settings: AppSettings) => Promise<void>;
  onClearChatHistory: () => void;
  onClose: () => void;
}

export function SettingsPage({ 
  apiConfig, 
  appSettings,
  onSaveApiConfig,
  onSaveAppSettings,
  onClearChatHistory,
  onClose 
}: SettingsPageProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  useEffect(() => {
    // Check notification permission
    const checkPerm = async () => {
      const status = await notificationService.getPermissionStatus();
      if (status === 'granted' || status === 'denied' || status === 'prompt') {
        setNotificationStatus(status === 'prompt' ? 'default' : status);
      }
    };
    checkPerm();
  }, []);

  // Countdown timer for test reminder
  useEffect(() => {
    if (testCountdown === null || testCountdown <= 0) return;
    const id = window.setInterval(() => setTestCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null)), 1000);
    return () => clearInterval(id);
  }, [testCountdown]);

  const handleVoiceToggle = () => {
    setLocalSettings(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        enabled: !prev.voiceSettings.enabled,
      },
    }));
  };

  const handleAutoSpeakToggle = () => {
    setLocalSettings(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        autoSpeak: !prev.voiceSettings.autoSpeak,
      },
    }));
  };

  const handleVolumeChange = (volume: number) => {
    setLocalSettings(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        volume,
      },
    }));
  };

  const handleSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    setLocalSettings(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        speed,
      },
    }));
  };

  const handleResponseLengthChange = (responseLength: ResponseLength) => {
    setLocalSettings(prev => ({
      ...prev,
      responseLength,
    }));
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
    if (granted) {
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleTestNotification = async () => {
    if (notificationStatus !== 'granted') {
      toast.error('Please enable notifications first');
      return;
    }

    // Native-safe: schedule a notification ~1s in the future.
    const fireAt = new Date(Date.now() + 1000);
    const testReminder = {
      id: `test_instant_${Date.now()}`,
      title: 'Test Notification',
      datetime: fireAt,
      completed: false,
      category: 'personal' as const,
      type: 'event' as const,
    };

    try {
      const notifId = await notificationService.scheduleReminder(testReminder);
      console.log('[MR!JK!] Instant test scheduled', { notifId, at: fireAt.toString() });
      toast.success('Test notification scheduled');
    } catch (err) {
      console.error('[MR!JK!] Failed to schedule instant test', err);
      toast.error('Failed to schedule test notification');
    }
  };

  const handleScheduleTestReminder = async () => {
    if (notificationStatus !== 'granted') {
      toast.error('Please enable notifications first');
      return;
    }

    const futureDate = new Date(Date.now() + 60 * 1000); // 60 seconds
    const testReminder = {
      id: `test_${Date.now()}`,
      title: 'Test Reminder (60s)',
      datetime: futureDate,
      completed: false,
      category: 'personal' as const,
      type: 'event' as const,
    };

    try {
      const notifId = await notificationService.scheduleReminder(testReminder);
      console.log('[MR!JK!] Scheduled test reminder', { notifId, at: futureDate.toString() });
      toast.success('Test reminder scheduled in 60 seconds');
      setTestCountdown(60);
    } catch (err) {
      console.error('[MR!JK!] Failed to schedule test reminder', err);
      toast.error('Failed to schedule test reminder');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveAppSettings(localSettings);
      toast.success('Settings saved!');
      onClose();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = () => {
    onClearChatHistory();
    setShowClearConfirm(false);
    toast.success('Chat history cleared!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto"
    >
      <div className="min-h-screen p-4 flex items-start justify-center pt-8">
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-lg glass rounded-2xl p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-mono">// SETTINGS</h2>
                <p className="text-sm text-muted-foreground">MR!JK! Configuration</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* API Status */}
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-sm">AI Status</span>
              </div>
              <div className="flex items-center gap-1 text-primary text-sm">
                <Check className="w-4 h-4" />
                Connected
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Using Lovable AI Gateway (no API key required)
            </p>
          </div>

          {/* Voice Assistant Settings */}
          <div className="space-y-4">
            <h3 className="font-mono font-medium flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              Voice Assistant
            </h3>
            
            <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
              {/* Voice On/Off */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Voice Output</span>
                <button
                  onClick={handleVoiceToggle}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    localSettings.voiceSettings.enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-background shadow"
                    animate={{ left: localSettings.voiceSettings.enabled ? '26px' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Auto-Speak Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-speak responses</span>
                <button
                  onClick={handleAutoSpeakToggle}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    localSettings.voiceSettings.autoSpeak ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-background shadow"
                    animate={{ left: localSettings.voiceSettings.autoSpeak ? '26px' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Volume</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {Math.round(localSettings.voiceSettings.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.voiceSettings.volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Speed Selection */}
              <div className="space-y-2">
                <span className="text-sm">Speed</span>
                <div className="flex gap-2">
                  {(['slow', 'normal', 'fast'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`flex-1 py-2 text-xs font-mono rounded-lg transition-colors ${
                        localSettings.voiceSettings.speed === speed
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {speed.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Response Length Settings */}
          <div className="space-y-4">
            <h3 className="font-mono font-medium flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              Response Length
            </h3>
            
            <div className="flex gap-2">
              {(['concise', 'balanced', 'detailed'] as ResponseLength[]).map((length) => (
                <button
                  key={length}
                  onClick={() => handleResponseLengthChange(length)}
                  className={`flex-1 py-3 text-xs font-mono rounded-lg transition-colors ${
                    localSettings.responseLength === length
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {length.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {localSettings.responseLength === 'concise' && 'Short, direct answers'}
              {localSettings.responseLength === 'balanced' && 'Moderate detail'}
              {localSettings.responseLength === 'detailed' && 'Comprehensive responses'}
            </p>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="font-mono font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </h3>
            
            <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {notificationStatus === 'granted' ? (
                    <Bell className="w-4 h-4 text-primary" />
                  ) : (
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Permission Status</span>
                </div>
                <span className={`text-xs font-mono px-2 py-1 rounded ${
                  notificationStatus === 'granted' 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-destructive/20 text-destructive'
                }`}>
                  {notificationStatus.toUpperCase()}
                </span>
              </div>

              {notificationStatus !== 'granted' && (
                <button
                  onClick={handleRequestNotificationPermission}
                  className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm transition-colors"
                >
                  Enable Notifications
                </button>
              )}

              {notificationStatus === 'granted' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleTestNotification}
                    className="flex-1 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    Instant Test
                  </button>
                  <button
                    onClick={handleScheduleTestReminder}
                    disabled={testCountdown !== null && testCountdown > 0}
                    className="flex-1 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Play className="w-4 h-4" />
                    {testCountdown !== null && testCountdown > 0 ? `${testCountdown}s` : '60s Reminder'}
                  </button>
                </div>
              )}

              {notificationStatus === 'denied' && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p>Permission denied. Please enable notifications in your browser/device settings.</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Controls */}
          <div className="space-y-4">
            <h3 className="font-mono font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Chat Controls
            </h3>
            
            {showClearConfirm ? (
              <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/30 space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete all chat history?</span>
                </div>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="flex-1 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm transition-colors"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-3 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat History
              </button>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
