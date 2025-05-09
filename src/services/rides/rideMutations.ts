import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createNotification } from '../notificationService';
import { RidePassenger } from './types';

export async function createRide(rideData: {
  from_location: string;
  to_location: string;
  from_coordinates: {
    lat: number;
    lng: number;
  };
  to_coordinates: {
    lat: number;
    lng: number;
  };
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

    const { data, error } = await supabase
      .from('rides')
      .insert({
        ...rideData,
        driver_id: sessionData.session.user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    toast.success('Ride created successfully');
    return data;
  } catch (error) {
    console.error('Error creating ride:', error);
    toast.error('Failed to create ride');
    return null;
  }
}

export async function updateRideStatus(rideId: string, status: 'active' | 'completed' | 'cancelled') {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.user) {
      toast.error('You must be logged in to update a ride');
      return false;
    }

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('driver_id')
      .eq('id', rideId)
      .single();

    if (rideError) {
      throw rideError;
    }

    if (ride.driver_id !== sessionData.session.user.id) {
      toast.error('You can only update rides that you created');
      return false;
    }

    const { error } = await supabase
      .from('rides')
      .update({ status })
      .eq('id', rideId);

    if (error) {
      throw error;
    }

    toast.success(`Ride marked as ${status}`);

    if (status === 'completed' || status === 'cancelled') {
      const { data: passengers } = await supabase
        .from('ride_passengers')
        .select(`
          passenger_id,
          passenger:profiles(full_name)
        `)
        .eq('ride_id', rideId)
        .eq('status', 'confirmed');

      if (passengers && passengers.length > 0) {
        passengers.forEach(async (passenger) => {
          await createNotification(
            passenger.passenger_id,
            `Ride ${status === 'completed' ? 'Completed' : 'Cancelled'}`,
            `Your ride has been marked as ${status} by the driver.`,
            `ride_${status}`,
            rideId
          );
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating ride status:', error);
    toast.error('Failed to update ride status');
    return false;
  }
}

export async function getRidePassengers(rideId: string): Promise<RidePassenger[]> {
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
