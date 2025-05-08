
import { Profile } from '../profileService';

export interface Ride {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  from_coordinates: {
    lat: number;
    lng: number;
  } | string;
  to_coordinates: {
    lat: number;
    lng: number;
  } | string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  price: number;
  notes?: string;
  status: string;
  created_at: string;
  driver?: Profile | null;
  estimated_duration?: number;
  route_preview?: string;
  is_quick_ride?: boolean;
  is_scheduled?: boolean;
  scheduled_for?: string;
  max_passengers?: number;
  current_passengers?: number;
  fare_estimate?: number;
  is_shared?: boolean;
  shared_passengers?: number;
  // For live tracking
  driver_location?: {
    lat: number;
    lng: number;
  };
  ride_status?: 'awaiting' | 'arriving' | 'in_progress' | 'completed';
  eta_minutes?: number;
  passengers?: RidePassenger[];
}

export interface RideSchedule {
  id: string;
  ride_id: string;
  schedule_type: 'daily' | 'weekly' | 'custom';
  schedule_days?: string[];
  schedule_dates?: string[];
  created_at: string;
  updated_at: string;
}

export interface RideShare {
  id: string;
  ride_id: string;
  sharer_id: string;
  shared_with_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QuickRoute {
  id: string;
  from_location: string;
  to_location: string;
  from_coordinates: {
    lat: number;
    lng: number;
  } | string;
  to_coordinates: {
    lat: number;
    lng: number;
  } | string;
  distance: number;
  estimated_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RidePassenger {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: string;
  created_at: string;
  passenger?: Profile | null;
}

export interface RoutePreview {
  distance: number; // in kilometers
  duration: number; // in minutes
  polyline: {
    encodedPath: string;
    strokeColor: string;
    strokeWeight: number;
  };
}

// Live tracking specific interfaces
export interface DriverLocation {
  driver_id: string;
  ride_id: string;
  location: {
    lat: number;
    lng: number;
  };
  heading: number;
  speed: number;
  timestamp: string;
}

export interface LiveRideStatus {
  ride_id: string;
  status: 'awaiting' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  eta_minutes: number;
  distance_remaining: number; // in kilometers
  last_updated: string;
}

export type Coordinates = {
  lat: number;
  lng: number;
};

// Helper function to normalize coordinates
export function normalizeCoordinates(coords: any): Coordinates {
  if (!coords) return { lat: 0, lng: 0 };
  
  if (typeof coords === 'string') {
    try {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(coords);
      if (parsed.lat !== undefined && parsed.lng !== undefined) {
        return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
      }
      
      // Handle comma-separated string format "lat,lng"
      const [lat, lng] = coords.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    } catch (e) {
      // If parsing fails, try to handle as a comma-separated string
      const [lat, lng] = coords.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } else if (coords.lat !== undefined && coords.lng !== undefined) {
    // Already in the correct format
    return { lat: Number(coords.lat), lng: Number(coords.lng) };
  } else if (Array.isArray(coords) && coords.length >= 2) {
    // Handle array format [lat, lng]
    return { lat: Number(coords[0]), lng: Number(coords[1]) };
  }
  
  // Default fallback
  return { lat: 0, lng: 0 };
}
