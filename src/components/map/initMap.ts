
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
          featureType: "water",
          elementType: "geometry",
          stylers: [
            { color: "#001E3C" } // Deep blue for water bodies
          ]
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [
            { color: "#121A2E" } // Dark blue for landscape
          ]
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [
            { color: "#293C72" }, // Medium blue for roads
            { lightness: 10 }
          ]
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [
            { color: "#4E3D9A" } // Purple for transit
          ]
        },
        {
          featureType: "administrative",
          elementType: "geometry.stroke",
          stylers: [
            { color: "#6E59A5" }, // Light purple for borders
            { weight: 1 }
          ]
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

// Function to create animated marker for driver's location
export const createDriverMarker = (
  map: google.maps.Map,
  position: { lat: number; lng: number },
  heading: number = 0
): google.maps.Marker => {
  // Define rocket SVG with rotation based on heading
  const createRocketSvg = (degrees: number) => {
    // Simple rocket SVG with rotation transform
    return {
      path: "M8,0 L16,16 L8,12 L0,16 L8,0 Z",
      fillColor: "#9b87f5", // Primary purple
      fillOpacity: 1,
      scale: 1.5,
      strokeColor: "#FFFFFF",
      strokeWeight: 1.5,
      rotation: degrees,
      anchor: new google.maps.Point(8, 8),
    };
  };

  const marker = new google.maps.Marker({
    position,
    map,
    icon: createRocketSvg(heading),
    title: "Driver",
    zIndex: 999, // Keep driver on top
    optimized: false, // Required for animations in some browsers
  });

  // Add pulse animation
  const pulseRadius = new google.maps.Circle({
    strokeColor: "#9b87f5",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#9b87f5",
    fillOpacity: 0.35,
    map,
    center: position,
    radius: 50, // meters
    zIndex: 998
  });

  // Store the circle in the marker for later reference
  (marker as any).pulseCircle = pulseRadius;

  // Animate the pulse
  let growing = true;
  let size = 50;
  
  setInterval(() => {
    if (growing) {
      size += 2;
      if (size > 80) growing = false;
    } else {
      size -= 2;
      if (size < 50) growing = true;
    }
    pulseRadius.setRadius(size);
  }, 50);

  return marker;
};

// Function to animate marker movement along a path
export const animateMarker = (
  marker: google.maps.Marker, 
  newPosition: { lat: number; lng: number },
  duration: number = 1500
): void => {
  if (!marker || !marker.getPosition()) return;
  
  const startPosition = marker.getPosition() as google.maps.LatLng;
  const startLat = startPosition.lat();
  const startLng = startPosition.lng();
  const endLat = newPosition.lat;
  const endLng = newPosition.lng;
  
  // Calculate heading for rocket rotation
  const heading = google.maps.geometry.spherical.computeHeading(
    new google.maps.LatLng(startLat, startLng),
    new google.maps.LatLng(endLat, endLng)
  );
  
  // Update rocket icon orientation
  if ((marker as any).getIcon) {
    const icon = (marker as any).getIcon();
    if (icon && icon.rotation !== undefined) {
      icon.rotation = heading;
      marker.setIcon(icon);
    }
  }
  
  // Animation function
  const startTime = new Date().getTime();
  const animate = () => {
    const now = new Date().getTime();
    const elapsed = now - startTime;
    const fraction = elapsed / duration;
    
    if (fraction < 1) {
      const lat = startLat + (endLat - startLat) * fraction;
      const lng = startLng + (endLng - startLng) * fraction;
      const position = new google.maps.LatLng(lat, lng);
      marker.setPosition(position);
      
      // Update pulse circle if it exists
      if ((marker as any).pulseCircle) {
        (marker as any).pulseCircle.setCenter(position);
      }
      
      requestAnimationFrame(animate);
    } else {
      // Animation complete
      marker.setPosition(new google.maps.LatLng(endLat, endLng));
      if ((marker as any).pulseCircle) {
        (marker as any).pulseCircle.setCenter(new google.maps.LatLng(endLat, endLng));
      }
    }
  };
  
  requestAnimationFrame(animate);
};

// Function to create a route path with orbital effect
export const createOrbitalRoute = (
  map: google.maps.Map,
  path: Array<{ lat: number; lng: number }>,
  primaryColor: string = "#9b87f5", 
  secondaryColor: string = "#33C3F0"
): google.maps.Polyline => {
  // Create gradient path
  const polyline = new google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor: primaryColor,
    strokeOpacity: 1.0,
    strokeWeight: 5,
    icons: [{
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillOpacity: 1,
        fillColor: secondaryColor,
        strokeWeight: 0,
        scale: 2
      },
      repeat: '20px'
    }],
    map
  });
  
  // Animate orbital dots
  let count = 0;
  setInterval(() => {
    count = (count + 1) % 200;
    const icons = polyline.get('icons');
    icons[0].offset = (count / 2) + '%';
    polyline.set('icons', icons);
  }, 50);
  
  return polyline;
};
