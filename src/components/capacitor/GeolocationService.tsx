
import { Geolocation, Position } from '@capacitor/geolocation';
import { useEffect, useState } from 'react';

// Helper function to request location permissions
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const status = await Geolocation.requestPermissions();
    return status.location === 'granted';
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
}

// Hook to get current position
export function useCurrentPosition(options: { watchPosition?: boolean } = {}) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let watchId: string | undefined;
    
    const getCurrentLocation = async () => {
      try {
        setLoading(true);
        const hasPermission = await requestLocationPermissions();
        
        if (!hasPermission) {
          throw new Error('Location permissions denied');
        }
        
        if (options.watchPosition) {
          watchId = await Geolocation.watchPosition(
            { enableHighAccuracy: true },
            (position) => {
              if (position) {
                setPosition(position);
                setLoading(false);
              }
            }
          );
        } else {
          const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
          setPosition(position);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setError(error);
        setLoading(false);
      }
    };
    
    getCurrentLocation();
    
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [options.watchPosition]);
  
  return { position, error, loading };
}
