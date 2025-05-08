import React, { useEffect, useRef, useState } from "react";
import { Loader2, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { useUserLocation } from "./useUserLocation";
import { initMap } from "./initMap";

interface RideMapProps {
  className?: string;
  showUserLocation?: boolean;
  initialCenter?: [number, number];
  zoom?: number;
  pickupLocation?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  dropLocation?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

const RideMap = ({
  className,
  showUserLocation = false,
  initialCenter = [20.5937, 78.9629], // Default India (lat, lng for Google Maps)
  zoom = 5,
  pickupLocation,
  dropLocation,
}: RideMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const dropMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const mapInitializedRef = useRef(false);

  const { userLocation, getUserLocation, isMapLoading: isLocationLoading, accuracy } = useUserLocation(mapInstance, markerRef);

  useEffect(() => {
    if (!mapContainerRef.current || mapInitializedRef.current) return;

    // Check if Google Maps API is loaded
    if (!window.googleMapsLoaded) {
      const checkApiLoaded = setInterval(() => {
        if (window.googleMapsLoaded) {
          clearInterval(checkApiLoaded);
          initializeMap();
        }
      }, 100);

      // Clear interval after 10 seconds if API hasn't loaded
      setTimeout(() => {
        clearInterval(checkApiLoaded);
        if (!window.googleMapsLoaded) {
          setApiError("Failed to load Google Maps API. Please refresh the page.");
          setIsMapLoading(false);
        }
      }, 10000);

      return () => clearInterval(checkApiLoaded);
    }

    initializeMap();
  }, [showUserLocation, initialCenter, zoom, getUserLocation, pickupLocation, dropLocation]);

  const initializeMap = () => {
    if (!window.google?.maps) {
      setApiError("Google Maps API not available");
      setIsMapLoading(false);
      return;
    }

    mapInitializedRef.current = true;

    const handleMapLoad = (map: google.maps.Map) => {
      setIsMapLoading(false);
      mapInstance.current = map;

      // Initialize directions renderer
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#7B61FF",
          strokeWeight: 5,
        },
      });
      directionsRendererRef.current.setMap(map);

      // Add My Location button
      const locationButton = document.createElement("button");
      locationButton.className = "bg-white hover:bg-gray-100 text-gray-800 font-semibold p-2 border border-gray-400 rounded-lg shadow";
      locationButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>';

      locationButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
          toast.error("Geolocation is not supported by your browser");
          return;
        }

        // Disable the button while loading
        locationButton.disabled = true;
        locationButton.style.opacity = "0.5";

        // Set a timeout to re-enable the button if location request takes too long
        const timeoutId = setTimeout(() => {
          locationButton.disabled = false;
          locationButton.style.opacity = "1";
          toast.error("Location request timed out. Please try again.");
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            const { latitude, longitude } = position.coords;

            if (mapInstance.current) {
              const latLng = new window.google.maps.LatLng(latitude, longitude);
              mapInstance.current.setCenter(latLng);
              mapInstance.current.setZoom(18);

              // Remove existing marker if any
              if (markerRef.current) {
                markerRef.current.setMap(null);
              }

              // Create new marker
              const marker = new window.google.maps.Marker({
                position: latLng,
                map: mapInstance.current,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: "#7B61FF",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                  scale: 8
                },
              });

              markerRef.current = marker;

              // Create accuracy circle
              const cityCircle = new window.google.maps.Circle({
                strokeColor: "#7B61FF",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#7B61FF",
                fillOpacity: 0.2,
                map: mapInstance.current,
                center: latLng,
                radius: position.coords.accuracy || 50,
              });
            }

            // Re-enable the button
            locationButton.disabled = false;
            locationButton.style.opacity = "1";
          },
          (error) => {
            clearTimeout(timeoutId);
            // Re-enable the button
            locationButton.disabled = false;
            locationButton.style.opacity = "1";

            let errorMessage = "Could not get your location. ";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += "Please enable location access in your browser settings.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += "Location information is unavailable.";
                break;
              case error.TIMEOUT:
                errorMessage += "Location request timed out.";
                break;
              default:
                errorMessage += "Please try again.";
            }
            toast.error(errorMessage);
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
          }
        );
      });

      // Add the button to the map
      map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);

      if (showUserLocation) {
        getUserLocation();
      }

      // Add pickup and drop markers and route if locations are provided
      if (pickupLocation && dropLocation) {
        // Remove existing markers
        if (pickupMarkerRef.current) pickupMarkerRef.current.setMap(null);
        if (dropMarkerRef.current) dropMarkerRef.current.setMap(null);

        // Create pickup marker
        const pickupLatLng = new window.google.maps.LatLng(
          pickupLocation.coordinates.lat,
          pickupLocation.coordinates.lng
        );
        pickupMarkerRef.current = new window.google.maps.Marker({
          position: pickupLatLng,
          map: mapInstance.current,
          title: pickupLocation.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#4CAF50",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8
          },
          label: {
            text: "P",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: "bold"
          }
        });

        // Create drop marker
        const dropLatLng = new window.google.maps.LatLng(
          dropLocation.coordinates.lat,
          dropLocation.coordinates.lng
        );
        dropMarkerRef.current = new window.google.maps.Marker({
          position: dropLatLng,
          map: mapInstance.current,
          title: dropLocation.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#F44336",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8
          },
          label: {
            text: "D",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: "bold"
          }
        });

        // Calculate and display route
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: pickupLatLng,
            destination: dropLatLng,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(result);

              // Fit map to show the entire route
              const bounds = result.routes[0].bounds;
              mapInstance.current?.fitBounds(bounds);
            } else {
              console.error("Error calculating route:", status);
            }
          }
        );
      }
    };

    const handleMapError = (e: unknown) => {
      setIsMapLoading(false);
      mapInitializedRef.current = false;
      setApiError("Error loading map. Please check your connection and try again.");
      console.error("Map error:", e);
    };

    try {
      const map = initMap({
        container: mapContainerRef.current!,
        initialCenter,
        zoom,
        onMapLoad: handleMapLoad,
        onMapError: handleMapError
      });
    } catch (error) {
      handleMapError(error);
    }
  };

  // Setup resize handler
  useEffect(() => {
    const handleResize = () => {
      if (mapInstance.current) {
        window.google?.maps?.event.trigger(mapInstance.current, 'resize');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={className}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {(isMapLoading || isLocationLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-cosmicviolet" />
        </div>
      )}
      {apiError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center p-4 bg-background rounded-lg shadow-lg">
            <p className="text-red-500">{apiError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-cosmicviolet text-white rounded-lg hover:bg-cosmicviolet/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideMap;
