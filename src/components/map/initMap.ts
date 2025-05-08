
import { toast } from "sonner";

export function initMap({
  container,
  initialCenter,
  zoom,
  onMapLoad,
  onMapError,
}: {
  container: HTMLDivElement;
  initialCenter: [number, number];
  zoom: number;
  onMapLoad: (map: google.maps.Map) => void;
  onMapError: (e: unknown) => void;
}) {
  try {
    if (!window.google || !window.google.maps) {
      throw new Error("Google Maps API not loaded");
    }

    const [lat, lng] = initialCenter;
    const mapOptions = {
      center: { lat, lng },
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    const map = new window.google.maps.Map(container, mapOptions);

    // No longer using NavigationControl as it doesn't exist
    // Just use the built-in controls via mapOptions

    // Handle map load event
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      onMapLoad(map);
    });

    // Handle map error event
    window.google.maps.event.addListener(map, 'error', (e) => {
      onMapError(e);
    });

    return map;
  } catch (error: any) {
    toast.error(`Map initialization failed: ${error.message}`);
    onMapError(error);
    return null;
  }
}
