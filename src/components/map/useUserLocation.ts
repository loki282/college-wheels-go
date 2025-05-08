import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export function useUserLocation(
  mapInstance: React.MutableRefObject<google.maps.Map | null>,
  markerRef: React.MutableRefObject<google.maps.Marker | null>
) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const updateMapLocation = useCallback((latitude: number, longitude: number) => {
    if (mapInstance.current && window.google?.maps) {
      // Remove existing marker if any
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Set map center and zoom
      const latLng = new window.google.maps.LatLng(latitude, longitude);
      mapInstance.current.setCenter(latLng);
      mapInstance.current.setZoom(18);

      // Create main marker
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
        draggable: true // Make marker draggable
      });

      // Add click listener to the map for manual location selection
      const clickListener = window.google.maps.event.addListener(
        mapInstance.current,
        'click',
        (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const newLat = event.latLng.lat();
            const newLng = event.latLng.lng();
            updateMapLocation(newLat, newLng);
            setUserLocation([newLng, newLat]);
            toast.success("Location updated! You can also drag the marker to adjust.");
          }
        }
      );

      // Add drag listener to the marker
      const dragListener = window.google.maps.event.addListener(
        marker,
        'dragend',
        () => {
          const newLat = marker.getPosition()?.lat();
          const newLng = marker.getPosition()?.lng();
          if (newLat && newLng) {
            setUserLocation([newLng, newLat]);
            toast.success("Location updated!");
          }
        }
      );

      markerRef.current = marker;

      // Create pulsing circle with accuracy radius
      const cityCircle = new window.google.maps.Circle({
        strokeColor: "#7B61FF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#7B61FF",
        fillOpacity: 0.2,
        map: mapInstance.current,
        center: latLng,
        radius: accuracy || 50,
      });

      // Cleanup listeners when component unmounts
      return () => {
        window.google.maps.event.removeListener(clickListener);
        window.google.maps.event.removeListener(dragListener);
      };
    }
  }, [mapInstance, markerRef, accuracy]);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (isMapLoading) return;
    setIsMapLoading(true);

    navigator.permissions
      .query({ name: "geolocation" })
      .then((permissionStatus) => {
        if (
          permissionStatus.state === "granted" ||
          permissionStatus.state === "prompt"
        ) {
          const locationTimeout = setTimeout(() => {
            setIsMapLoading(false);
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              toast.info("Retrying to get more accurate location...");
              getUserLocation();
            } else {
              toast.info("Could not get accurate location. You can click on the map or drag the marker to set your location manually.");
            }
          }, 20000);

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(locationTimeout);
              const { longitude, latitude, accuracy } = position.coords;

              if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
                toast.error("Invalid coordinates received. You can click on the map to set your location manually.");
                if (retryCountRef.current < maxRetries) {
                  retryCountRef.current++;
                  getUserLocation();
                }
                return;
              }

              setUserLocation([longitude, latitude]);
              setAccuracy(accuracy);
              updateMapLocation(latitude, longitude);
              setIsMapLoading(false);

              if (watchIdRef.current === null) {
                watchIdRef.current = navigator.geolocation.watchPosition(
                  (position) => {
                    const { longitude, latitude, accuracy } = position.coords;

                    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
                      return;
                    }

                    setUserLocation([longitude, latitude]);
                    setAccuracy(accuracy);
                    updateMapLocation(latitude, longitude);
                  },
                  (error) => {
                    console.error("Geolocation watch error:", error);
                    toast.info("Location updates paused. You can click on the map to set your location manually.");
                  },
                  {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                  }
                );
              }
            },
            (error) => {
              clearTimeout(locationTimeout);
              setIsMapLoading(false);
              let errorMessage = "Could not get your location. ";
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage += "Please enable location access in your browser settings or click on the map to set your location manually.";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage += "Location information is unavailable. Please click on the map to set your location manually.";
                  break;
                case error.TIMEOUT:
                  if (retryCountRef.current < maxRetries) {
                    retryCountRef.current++;
                    toast.info("Retrying to get more accurate location...");
                    getUserLocation();
                    return;
                  }
                  errorMessage += "Please click on the map to set your location manually.";
                  break;
                default:
                  errorMessage += "Please click on the map to set your location manually.";
              }
              toast.error(errorMessage);
              console.error("Geolocation error:", error);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            }
          );
        } else {
          setIsMapLoading(false);
          toast.error("Location permission denied. Please click on the map to set your location manually.");
        }
      })
      .catch((error) => {
        setIsMapLoading(false);
        toast.error("Geolocation is not supported by your browser. Please click on the map to set your location manually.");
        console.error("Permissions error:", error);
      });
  }, [isMapLoading, mapInstance, markerRef, updateMapLocation]);

  // Cleanup watch position on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return { userLocation, getUserLocation, isMapLoading, accuracy };
}
