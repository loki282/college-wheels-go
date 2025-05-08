
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '../profileService';
import { Ride, RidePassenger } from './types';

export async function getAvailableRides() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        driver:profiles(*)
      `)
      .eq('status', 'active')
      .order('departure_date', { ascending: true })
      .order('departure_time', { ascending: true });

    if (error) {
      throw error;
    }

    const rides = userId
      ? (data as (Ride & { driver: Profile | null })[]).filter(ride => ride.driver_id !== userId)
      : (data as (Ride & { driver: Profile | null })[]);

    return rides.map(ride => ({
      ...ride,
      driver: ride.driver || null
    }));
  } catch (error) {
    console.error('Error fetching available rides:', error);
    toast.error('Failed to load available rides');
    return [];
  }
}

export async function getUserRides(status?: 'active' | 'completed' | 'cancelled') {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.user) {
      return [];
    }

    const userId = sessionData.session.user.id;

    let query = supabase
      .from('rides')
      .select(`
        *,
        driver:profiles(*)
      `)
      .eq('driver_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: driverRides, error: driverError } = await query;

    if (driverError) {
      throw driverError;
    }

    let passengerQuery = supabase
      .from('ride_passengers')
      .select(`
        *,
        ride:rides(
          *,
          driver:profiles(*)
        )
      `)
      .eq('passenger_id', userId);

    if (status) {
      passengerQuery = passengerQuery.eq('ride.status', status);
    }

    const { data: passengerRides, error: passengerError } = await passengerQuery;

    if (passengerError) {
      throw passengerError;
    }

    const ridesByDriver = driverRides.map(ride => ({
      ...ride,
      driver: ride.driver || null,
      userRole: 'driver' as const
    }));

    const ridesByPassenger = passengerRides
      .filter(booking => booking.ride)
      .map(booking => ({
        ...booking.ride,
        driver: booking.ride?.driver || null,
        bookingStatus: booking.status,
        userRole: 'passenger' as const,
        bookingId: booking.id
      }));

    return [...ridesByDriver, ...ridesByPassenger];
  } catch (error) {
    console.error('Error fetching user rides:', error);
    toast.error('Failed to load your rides');
    return [];
  }
}

export async function getRideById(rideId: string) {
  try {
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        driver:profiles(*)
      `)
      .eq('id', rideId)
      .single();

    if (error) {
      throw error;
    }

    const { data: passengers, error: passengersError } = await supabase
      .from('ride_passengers')
      .select(`
        *,
        passenger:profiles(*)
      `)
      .eq('ride_id', rideId);

    if (passengersError) {
      throw passengersError;
    }

    return {
      ...data,
      driver: data.driver || null,
      passengers: passengers || []
    };
  } catch (error) {
    console.error('Error fetching ride details:', error);
    toast.error('Failed to load ride details');
    return null;
  }
}
