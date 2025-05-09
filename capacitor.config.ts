
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.orbitride.ridesharing',
  appName: 'OrbitRide',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://lovable.dev',
    cleartext: true
  },
  plugins: {
    // Configure plugins if needed
    Geolocation: {
      permissions: {
        ios: {
          usage: "Track vehicle location during rides"
        }
      }
    }
  }
};

export default config;
