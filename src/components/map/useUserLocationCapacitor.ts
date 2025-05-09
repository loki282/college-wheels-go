
import { useEffect, useState } from 'react';
import { useCurrentPosition } from '../capacitor/GeolocationService';
import { Capacitor } from '@capacitor/core';

export const useUserLocationCapacitor = (options: { autoGet?: boolean } = {}) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { position, loading, error: positionError } = useCurrentPosition({
    watchPosition: options.autoGet
  });
  
  useEffect(() => {
    if (position) {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    }
    setIsLoading(loading);
    if (positionError) {
      setError('Could not get your location. Please check your device settings.');
    }
  }, [position, loading, positionError]);
  
  const getUserLocation = async () => {
    setIsLoading(true);
    try {
      // This will trigger the position watcher to update
      const hasPermission = await requestLocationPermissions();
      if (!hasPermission) {
        setError('Location permissions denied');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      setError('Could not get your location');
      setIsLoading(false);
    }
  };
  
  return { location, isLoading, error, getUserLocation };
};

// Helper function to determine if we should use the Capacitor implementation
export const shouldUseCapacitorLocation = () => {
  return Capacitor.isNativePlatform();
};

// Import this so it's available in the module
import { requestLocationPermissions } from '../capacitor/GeolocationService';
