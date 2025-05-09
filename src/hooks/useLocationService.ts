
import { shouldUseCapacitorLocation, useUserLocationCapacitor } from '@/components/map/useUserLocationCapacitor';
import { useUserLocation } from '@/components/map/useUserLocation';

// This hook will use the appropriate location service based on platform
export const useLocationService = (options: { autoGet?: boolean } = {}) => {
  const isNative = shouldUseCapacitorLocation();
  
  const nativeLocation = useUserLocationCapacitor(options);
  const webLocation = useUserLocation(options);
  
  return isNative ? nativeLocation : webLocation;
};
