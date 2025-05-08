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
        }
      ],
      ...options
    };

    const map = new window.google.maps.Map(container, mapOptions);

    // No longer using NavigationControl as it doesn't exist
    // Just use the built-in controls via mapOptions

    // Handle map load event
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      resolve(map);
    });
  });
};
