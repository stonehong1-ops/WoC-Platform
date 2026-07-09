import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.woc.today',
  appName: 'Tango World',
  webDir: 'public',
  server: {
    url: 'https://www.woc.today',
    cleartext: false
  }
};

export default config;
