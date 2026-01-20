import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAPACITOR_LIVE_RELOAD_URL;

const config: CapacitorConfig = {
  appId: 'app.lovable.226d7d2846e64616b782ff5dfb421ca3',
  appName: 'MR!JK!',
  webDir: 'dist',
  ...(liveReloadUrl
    ? {
        server: {
          // Dev-only live reload (do not set for production builds)
          url: liveReloadUrl,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    LocalNotifications: {
      // Use default launcher icon (exists in a standard Capacitor Android project)
      smallIcon: 'ic_launcher',
      iconColor: '#1E90FF',
    },
  },
};

export default config;

