import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X, Key, Shield, Save, Trash2 } from 'lucide-react';
import { APIConfig } from '@/types';
import { aiRouter } from '@/services/ai-router';

interface SettingsPageProps {
  apiConfig: APIConfig | null;
  onSave: (config: APIConfig) => Promise<void>;
  onClose: () => void;
}

export function SettingsPage({ apiConfig, onSave, onClose }: SettingsPageProps) {
  const [emotionalKey, setEmotionalKey] = useState(apiConfig?.emotionalApiKey || '');
  const [technicalKey, setTechnicalKey] = useState(apiConfig?.technicalApiKey || '');
  const [showEmotional, setShowEmotional] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [emotionalValid, setEmotionalValid] = useState<boolean | null>(null);
  const [technicalValid, setTechnicalValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validateEmotionalKey = async () => {
    setIsValidating(true);
    const valid = await aiRouter.validateApiKey();
    setEmotionalValid(valid);
    setIsValidating(false);
  };

  const validateTechnicalKey = async () => {
    setIsValidating(true);
    const valid = await aiRouter.validateApiKey();
    setTechnicalValid(valid);
    setIsValidating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        emotionalApiKey: emotionalKey,
        technicalApiKey: technicalKey,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const clearKeys = () => {
    setEmotionalKey('');
    setTechnicalKey('');
    setEmotionalValid(null);
    setTechnicalValid(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">API Settings</h2>
              <p className="text-sm text-muted-foreground">Securely stored on device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Emotional Mode API Key */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              Emotional Mode API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showEmotional ? 'text' : 'password'}
                value={emotionalKey}
                onChange={(e) => {
                  setEmotionalKey(e.target.value);
                  setEmotionalValid(null);
                }}
                placeholder="sk-..."
                className="w-full pl-10 pr-24 py-3 bg-muted border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => setShowEmotional(!showEmotional)}
                  className="p-1.5 hover:bg-background/50 rounded"
                >
                  {showEmotional ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={validateEmotionalKey}
                  disabled={!emotionalKey || isValidating}
                  className="px-2 py-1 text-xs bg-secondary/20 hover:bg-secondary/30 rounded text-secondary disabled:opacity-50"
                >
                  Test
                </button>
              </div>
            </div>
            {emotionalValid !== null && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs mt-2 flex items-center gap-1 ${
                  emotionalValid ? 'text-neon-green' : 'text-destructive'
                }`}
              >
                {emotionalValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {emotionalValid ? 'Key validated successfully' : 'Invalid key format'}
              </motion.p>
            )}
          </div>

          {/* Technical Mode API Key */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Technical Mode API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showTechnical ? 'text' : 'password'}
                value={technicalKey}
                onChange={(e) => {
                  setTechnicalKey(e.target.value);
                  setTechnicalValid(null);
                }}
                placeholder="sk-..."
                className="w-full pl-10 pr-24 py-3 bg-muted border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => setShowTechnical(!showTechnical)}
                  className="p-1.5 hover:bg-background/50 rounded"
                >
                  {showTechnical ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={validateTechnicalKey}
                  disabled={!technicalKey || isValidating}
                  className="px-2 py-1 text-xs bg-primary/20 hover:bg-primary/30 rounded text-primary disabled:opacity-50"
                >
                  Test
                </button>
              </div>
            </div>
            {technicalValid !== null && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs mt-2 flex items-center gap-1 ${
                  technicalValid ? 'text-neon-green' : 'text-destructive'
                }`}
              >
                {technicalValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {technicalValid ? 'Key validated successfully' : 'Invalid key format'}
              </motion.p>
            )}
          </div>

          {/* Security notice */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <Shield className="w-3 h-3 inline mr-1" />
              Keys are stored securely on your device and never transmitted to our servers.
              In production, use platform-specific secure storage (Keychain/Keystore).
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={clearKeys}
              className="flex-1 py-3 px-4 bg-muted hover:bg-muted/80 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
