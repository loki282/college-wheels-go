
import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

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
            toast.info("Could not get accurate location. You can click on the map to set your location manually.");
          }, 20000);

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(locationTimeout);
              const { longitude, latitude, accuracy } = position.coords;

              if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
                toast.error("Invalid coordinates received. You can click on the map to set your location manually.");
                return;
              }

              setUserLocation([longitude, latitude]);
              setAccuracy(accuracy);
              setIsMapLoading(false);
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
  }, [isMapLoading]);

  return { userLocation, getUserLocation, isMapLoading, accuracy };
}
