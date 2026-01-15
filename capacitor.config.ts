import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.226d7d2846e64616b782ff5dfb421ca3',
  appName: 'JK Assistant',
  webDir: 'dist',
  server: {
    // For development - connects to live preview
    // Remove this block for production builds
    url: 'https://226d7d28-46e6-4616-b782-ff5dfb421ca3.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#00FFD1',
      sound: 'beep.wav',
    },
  },
};

export default config;
