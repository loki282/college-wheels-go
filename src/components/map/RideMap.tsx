import React, { useRef, useState, useEffect } from 'react';
import { initMap } from './initMap';
import { Button } from '../ui/button';
import { Loader2, MapPin } from 'lucide-react';
import { normalizeCoordinates } from '@/services/rides/types';

type RideMapProps = {
  height?: string;
  showUserLocation?: boolean;
  initialCenter?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
    animate?: boolean;
  }>;
  polyline?: Array<{ lat: number; lng: number }>;
  children?: React.ReactNode;
  className?: string;
  pickupLocation?: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  dropLocation?: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  autoFitBounds?: boolean;
};

export const RideMap: React.FC<RideMapProps> = ({
  height = '400px',
  showUserLocation = true,
  initialCenter,
  zoom = 14,
  onMapClick,
  markers = [],
  polyline,
  children,
  className = '',
  pickupLocation,
  dropLocation,
  autoFitBounds = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const mapInitializedRef = useRef<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Function to handle map errors
  const handleMapError = (error: any) => {
    console.error("Map initialization error:", error);
    setMapError("Failed to load map. Please check your connection and try again.");
  };

  // Function to get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setMapError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat: latitude, lng: longitude });
          
          // Add user location marker
          new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: mapInstance.current,
            title: "Your Location",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              scale: 8
            },
          });
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setMapError("Could not get your location. Please check your browser settings.");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Effect for initializing the map
  useEffect(() => {
    if (!mapRef.current || mapInitializedRef.current) return;

    try {
      const mapCenter = initialCenter || 
                        (pickupLocation?.coordinates) || 
                        (userLocation) || 
                        { lat: 37.7749, lng: -122.4194 }; // Default to SF
      
      initMap(mapRef.current, mapCenter, zoom).then((map) => {
        mapInstance.current = map;
        mapInitializedRef.current = true;
        
        // If we should show user location, get it
        if (showUserLocation && !userLocation) {
          getUserLocation();
        }
        
        // Add pickup and dropoff markers if provided
        if (pickupLocation?.coordinates) {
          new window.google.maps.Marker({
            position: pickupLocation.coordinates,
            map: mapInstance.current,
            title: pickupLocation.name || "Pickup",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: "#4CAF50",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              scale: 8
            },
          });
        }
        
        if (dropLocation?.coordinates) {
          new window.google.maps.Marker({
            position: dropLocation.coordinates,
            map: mapInstance.current,
            title: dropLocation.name || "Drop-off",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: "#F44336",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              scale: 8
            },
          });
          
          // If both pickup and dropoff are provided and autoFitBounds is enabled, fit bounds to show both
          if (pickupLocation?.coordinates && autoFitBounds) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(pickupLocation.coordinates);
            bounds.extend(dropLocation.coordinates);
            mapInstance.current.fitBounds(bounds);
          }
        }
      });
    } catch (error) {
      handleMapError(error);
    }

    // Setup event listeners using standard window.addEventListener
    const handleResize = () => {
      if (mapInstance.current) {
        window.google.maps.event.trigger(mapInstance.current, 'resize');
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      mapInitializedRef.current = false;
    };
  }, [showUserLocation, initialCenter, zoom, pickupLocation, dropLocation, userLocation, autoFitBounds]);

  // Effect to handle map clicks
  useEffect(() => {
    if (!mapInstance.current || !onMapClick) return;

    const handleClick = (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        onMapClick({ lat, lng });
      }
    };

    const listener = window.google.maps.event.addListener(
      mapInstance.current, 
      "click", 
      handleClick
    );

    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [onMapClick]);

  // Effect to handle markers
  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    if (mapInstance.current) {
      const bounds = new window.google.maps.LatLngBounds();
      let shouldUseBounds = autoFitBounds && markers.length > 1;
      
      markers.forEach((markerInfo) => {
        // Process icon
        let icon: google.maps.Symbol | string = markerInfo.icon || "";
        
        // If icon is emoji or text, create a custom marker
        if (typeof icon === 'string' && icon.length <= 2) {
          icon = {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: markerInfo.title === "Driver" ? "#4285F4" : 
                      icon === "🔵" ? "#4CAF50" : 
                      icon === "🔴" ? "#F44336" : "#FFC107",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8,
            labelOrigin: new window.google.maps.Point(0, 0)
          };
        }
        
        const marker = new window.google.maps.Marker({
          position: markerInfo.position,
          map: mapInstance.current,
          title: markerInfo.title,
          icon: icon,
          label: typeof markerInfo.icon === 'string' && markerInfo.icon.length <= 2 ? {
            text: markerInfo.icon,
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: "bold"
          } : undefined,
          animation: markerInfo.animate ? window.google.maps.Animation.BOUNCE : undefined
        });
        
        markersRef.current.push(marker);
        
        if (shouldUseBounds) {
          bounds.extend(markerInfo.position);
        }
      });
      
      // Fit map to show all markers if there are multiple
      if (shouldUseBounds) {
        mapInstance.current.fitBounds(bounds);
        // Add some padding
        const listener = window.google.maps.event.addListenerOnce(
          mapInstance.current, 
          'bounds_changed', 
          () => {
            mapInstance.current?.setZoom((mapInstance.current.getZoom() || 14) - 1);
          }
        );
      }
    }
  }, [markers, mapInstance.current, autoFitBounds]);

  // Effect to handle polylines
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (polyline && polyline.length > 0) {
      const newPolyline = new window.google.maps.Polyline({
        path: polyline,
        geodesic: true,
        strokeColor: "#22c55e",
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map: mapInstance.current,
      });
      polylineRef.current = newPolyline;
      
      // If autoFitBounds is true, fit bounds to show the entire polyline
      if (autoFitBounds) {
        const bounds = new window.google.maps.LatLngBounds();
        polyline.forEach(point => {
          bounds.extend(point);
        });
        mapInstance.current.fitBounds(bounds);
      }
    }
  }, [polyline, mapInstance.current, autoFitBounds]);

  return (
    <div className={`relative ${className}`}>
      {mapError && (
        <div className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded z-10">
          {mapError}
        </div>
      )}
      <div ref={mapRef} style={{ height: height }} className="w-full rounded" />
      {isLoadingLocation && (
        <div className="absolute top-2 left-2 bg-white bg-opacity-70 backdrop-blur-sm p-2 rounded z-10">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Locating...
        </div>
      )}
      {children}
    </div>
  );
};

// Also export as default to support existing imports
export default RideMap;
