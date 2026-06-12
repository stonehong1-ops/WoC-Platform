import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'today.woc.tango',
  appName: 'Tango World',
  webDir: 'public',
  server: {
    url: 'https://www.woc.today',
    cleartext: true
  }
};

export default config;
