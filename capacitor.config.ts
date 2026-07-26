import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.woc.today',
  appName: 'TangoWorld',
  webDir: 'native-shell',
  server: {
    url: 'https://www.woc.today',
    cleartext: false
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
