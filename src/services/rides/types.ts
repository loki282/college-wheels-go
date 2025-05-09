import { Profile } from '../profileService';

export interface Ride {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  from_coordinates?: {
    lat: number;
    lng: number;
  } | string;
  to_coordinates?: {
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
  is_active?: boolean;
  started_at?: string;
  completed_at?: string;
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

// Add a helper function to normalize coordinates
export function normalizeCoordinates(coordinates: string | { lat: number; lng: number; } | undefined): 
  { lat: number; lng: number; } | undefined {
  if (!coordinates) return undefined;
  
  if (typeof coordinates === 'string') {
    try {
      return JSON.parse(coordinates);
    } catch (e) {
      console.error("Failed to parse coordinates:", e);
      return undefined;
    }
  }
  
  return coordinates;
}
