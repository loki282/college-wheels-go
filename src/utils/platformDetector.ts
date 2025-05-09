
import { Capacitor } from '@capacitor/core';

export const isPlatform = {
  /**
   * Checks if the app is running on a native mobile platform
   */
  isNative: () => Capacitor.isNativePlatform(),
  
  /**
   * Checks if the app is running on iOS
   */
  isIOS: () => Capacitor.getPlatform() === 'ios',
  
  /**
   * Checks if the app is running on Android
   */
  isAndroid: () => Capacitor.getPlatform() === 'android',
  
  /**
   * Checks if the app is running on the web
   */
  isWeb: () => Capacitor.getPlatform() === 'web',
  
  /**
   * Gets the current platform
   */
  platform: () => Capacitor.getPlatform()
};
