
interface MapOptions {
  zoom?: number;
  center?: { lat: number; lng: number };
  draggable?: boolean;
  scrollwheel?: boolean;
  disableDefaultUI?: boolean;
}

// Initialize Google Maps
export const initMap = async (
  container: HTMLElement, 
  center: { lat: number; lng: number } = { lat: 37.7749, lng: -122.4194 }, 
  zoom: number = 14,
  options: MapOptions = {}
): Promise<google.maps.Map> => {
  // Wait for Google Maps to be loaded
  if (!window.google?.maps) {
    throw new Error('Google Maps API not loaded');
  }

  return new Promise((resolve) => {
    const mapOptions = {
      zoom,
      center,
      draggable: true,
      scrollwheel: true,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "transit",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#f5f5f5" }]
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#c9c9c9" }]
        }
      ],
      ...options
    };

    const map = new window.google.maps.Map(container, mapOptions);

    // Handle map load event
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      resolve(map);
    });
  });
};

// Helper function to create a custom marker icon
export const createCustomMarker = (
  text: string,
  backgroundColor: string = "#4285F4",
  textColor: string = "#FFFFFF"
): google.maps.Symbol => {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: backgroundColor,
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: 8,
  };
};

// Helper function to add pulse animation to a marker
export const addPulseEffect = (marker: google.maps.Marker): void => {
  const icon = marker.getIcon() as google.maps.Symbol;
  if (!icon) return;

  let direction = 1;
  let scale = icon.scale || 8;
  const minScale = 7;
  const maxScale = 9;
  const step = 0.1;

  setInterval(() => {
    scale += step * direction;
    if (scale >= maxScale) direction = -1;
    if (scale <= minScale) direction = 1;

    marker.setIcon({
      ...icon,
      scale
    });
  }, 100);
};
