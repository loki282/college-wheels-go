import React, { useRef, useState, useEffect } from 'react';
import { useUserLocation } from './useUserLocation';
import { initMap } from './initMap';
import { Button } from '../ui/button';
import { Loader2, MapPin } from 'lucide-react';

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
  }>;
  polyline?: Array<{ lat: number; lng: number }>;
  children?: React.ReactNode;
  className?: string;
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
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const mapInitializedRef = useRef<boolean>(false);
  const { getUserLocation, userLocation, locationLoading } = useUserLocation();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Function to handle map errors
  const handleMapError = (error: any) => {
    console.error("Map initialization error:", error);
    setMapError("Failed to load map. Please check your connection and try again.");
  };

  // Effect for initializing the map
  useEffect(() => {
    if (!mapRef.current || mapInitializedRef.current) return;

    try {
      const mapCenter = initialCenter || (userLocation && showUserLocation 
        ? userLocation 
        : { lat: 37.7749, lng: -122.4194 }); // Default to SF
      
      initMap(mapRef.current, mapCenter, zoom).then((map) => {
        mapInstance.current = map;
        mapInitializedRef.current = true;
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
  }, [showUserLocation, initialCenter, zoom, getUserLocation]);

  // Effect to update map when user location changes
  useEffect(() => {
    if (userLocation && mapInstance.current && showUserLocation) {
      mapInstance.current.setCenter(userLocation);
      new window.google.maps.Marker({
        position: userLocation,
        map: mapInstance.current,
        title: "Your Location",
      });
    }
  }, [userLocation, showUserLocation]);

  // Effect to handle map clicks
  useEffect(() => {
    if (!mapInstance.current || !onMapClick) return;

    const handleClick = (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setSelectedLocation({ lat, lng });
        onMapClick({ lat, lng });
      }
    };

    mapInstance.current.addListener("click", handleClick);

    return () => {
      if (mapInstance.current) {
        window.google.maps.event.clearListeners(mapInstance.current, "click");
      }
    };
  }, [onMapClick]);

  // Effect to handle markers
  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerInfo) => {
      const marker = new window.google.maps.Marker({
        position: markerInfo.position,
        map: mapInstance.current,
        title: markerInfo.title,
        icon: markerInfo.icon,
      });
      markersRef.current.push(marker);
    });
  }, [markers, mapInstance.current]);

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
    }
  }, [polyline, mapInstance.current]);

  return (
    <div className={`relative ${className}`}>
      {mapError && (
        <div className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded z-10">
          {mapError}
        </div>
      )}
      <div ref={mapRef} style={{ height: height }} className="w-full rounded" />
      {locationLoading && (
        <div className="absolute top-2 left-2 bg-white bg-opacity-70 backdrop-blur-sm p-2 rounded z-10">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Locating...
        </div>
      )}
      {children}
    </div>
  );
};
