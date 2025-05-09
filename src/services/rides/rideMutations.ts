
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Ride, RidePassenger } from './types';

export async function createRide(rideData: {
  from_location: string;
  to_location: string;
  from_coordinates?: { lat: number; lng: number } | string;
  to_coordinates?: { lat: number; lng: number } | string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  price: number;
  notes?: string | null;
}) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.user) {
      toast.error('You must be logged in to create a ride');
      return null;
    }

    // Ensure coordinates are properly formatted as strings for database storage
    const formattedRideData = {
      ...rideData,
      from_coordinates: rideData.from_coordinates 
        ? (typeof rideData.from_coordinates === 'string' 
            ? rideData.from_coordinates 
            : JSON.stringify(rideData.from_coordinates))
        : null,
      to_coordinates: rideData.to_coordinates 
        ? (typeof rideData.to_coordinates === 'string'
            ? rideData.to_coordinates
            : JSON.stringify(rideData.to_coordinates))
        : null,
      driver_id: sessionData.session.user.id,
      status: 'active'
    };

    const { data, error } = await supabase
      .from('rides')
      .insert(formattedRideData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    toast.success('Ride created successfully');
    return data as Ride;
  } catch (error) {
    console.error('Error creating ride:', error);
    toast.error('Failed to create ride');
    return null;
  }
}

// Add the missing getRidePassengers function
export async function getRidePassengers(rideId: string) {
  try {
    const { data, error } = await supabase
      .from('ride_passengers')
      .select(`
        *,
        passenger:profiles(*)
      `)
      .eq('ride_id', rideId);

    if (error) {
      throw error;
    }

    return data as RidePassenger[];
  } catch (error) {
    console.error('Error fetching ride passengers:', error);
    return [];
  }
}
