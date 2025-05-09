import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from './profileService';
import { createNotification } from './notificationService';
import { Ride as RideType, normalizeCoordinates } from './rides/types';

// Re-export the Ride type from the rides/types file
export type { Ride } from './rides/types';
export { normalizeCoordinates } from './rides/types';

export interface RidePassenger {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  passenger?: Profile | null;
}

// Type definitions
// Using RideType for clarity but re-exported as Ride
export type Ride = RideType;

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

    // Filter out rides created by the current user if logged in
    const rides = userId
      ? (data as (Ride & { driver: Profile | null })[]).filter(ride => ride.driver_id !== userId)
      : (data as (Ride & { driver: Profile | null })[]);

    // Make sure data is properly formed even if driver profiles are empty/null
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
      .filter(booking => booking.ride) // Filter out any null rides
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

    // Get passengers for this ride
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

    // Process data to ensure coordinates are properly formatted
    const rideWithFormattedData = {
      ...data,
      driver: data.driver || null,
      passengers: passengers || []
    };

    return rideWithFormattedData;
  } catch (error) {
    console.error('Error fetching ride details:', error);
    toast.error('Failed to load ride details');
    return null;
  }
}

export async function createRide(rideData: {
  from_location: string;
  to_location: string;
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

    // First check if the user is the driver of this ride
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

    // If ride is completed, also update all confirmed bookings to completed
    if (status === 'completed') {
      const { error: bookingError } = await supabase
        .from('ride_passengers')
        .update({ status: 'completed' })
        .eq('ride_id', rideId)
        .eq('status', 'confirmed');

      if (bookingError) {
        throw bookingError;
      }
    }

    toast.success(`Ride marked as ${status}`);

    // Get passengers to notify them
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
        // Notify each passenger about the ride status change
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

export async function bookRide(rideId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.user) {
      toast.error('You must be logged in to book a ride');
      return false;
    }

    // Check if the user already booked this ride
    const { data: existingBooking, error: checkError } = await supabase
      .from('ride_passengers')
      .select('id, status')
      .eq('passenger_id', sessionData.session.user.id)
      .eq('ride_id', rideId);

    if (checkError) {
      throw checkError;
    }

    if (existingBooking && existingBooking.length > 0) {
      if (existingBooking[0].status === 'cancelled') {
        toast.error('Your previous booking was cancelled. Contact the driver for more information.');
      } else {
        toast.error('You have already booked this ride');
      }
      return false;
    }

    // Get ride details to check available seats
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('available_seats, driver_id')
      .eq('id', rideId)
      .single();

    if (rideError) {
      throw rideError;
    }

    // Check if user is the driver
    if (ride.driver_id === sessionData.session.user.id) {
      toast.error('You cannot book your own ride');
      return false;
    }

    // Check available seats
    if (ride.available_seats <= 0) {
      toast.error('No seats available for this ride');
      return false;
    }

    // Book the ride with pending status - no seat is reduced yet until confirmation
    const { data, error } = await supabase
      .from('ride_passengers')
      .insert({
        passenger_id: sessionData.session.user.id,
        ride_id: rideId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Get passenger name for notification
    const { data: passenger } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sessionData.session.user.id)
      .single();

    // Get ride details for notification
    const { data: rideDetails } = await supabase
      .from('rides')
      .select('from_location, to_location')
      .eq('id', rideId)
      .single();

    // Create notification for driver about the booking request
    await createNotification(
      ride.driver_id,
      'New Booking Request',
      `${passenger?.full_name || 'A passenger'} wants to join your ride from ${rideDetails?.from_location} to ${rideDetails?.to_location}`,
      'booking_request',
      rideId
    );

    toast.success('Ride booking request sent');
    return true;
  } catch (error) {
    console.error('Error booking ride:', error);
    toast.error('Failed to book ride');
    return false;
  }
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.user) {
      toast.error('You must be logged in to update a booking');
      return false;
    }

    // Get the booking details first
    const { data: bookingData, error: bookingQueryError } = await supabase
      .from('ride_passengers')
      .select(`
        id,
        ride_id,
        passenger_id,
        status,
        passenger:profiles(full_name)
      `)
      .eq('id', bookingId);

    if (bookingQueryError) {
      throw bookingQueryError;
    }

    // Check if booking exists
    if (!bookingData || bookingData.length === 0) {
      toast.error('Booking not found');
      return false;
    }

    // Use the first result instead of .single()
    const booking = bookingData[0];

    // If the booking is already in the requested status, return success
    if (booking.status === status) {
      toast.info(`Booking is already ${status}`);
      return true;
    }

    // Get the ride to check if the current user is the driver
    const { data: rideData, error: rideError } = await supabase
      .from('rides')
      .select(`
        driver_id,
        from_location,
        to_location,
        available_seats
      `)
      .eq('id', booking.ride_id);

    if (rideError) {
      throw rideError;
    }

    if (!rideData || rideData.length === 0) {
      toast.error('Ride not found');
      return false;
    }

    const ride = rideData[0];

    if (ride.driver_id !== sessionData.session.user.id) {
      toast.error('Only the driver can update booking status');
      return false;
    }

    // If confirming and there are no available seats
    if (status === 'confirmed' && ride.available_seats <= 0) {
      toast.error('Cannot confirm booking: No seats available');
      return false;
    }

    // Update the booking status
    const { error } = await supabase
      .from('ride_passengers')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      throw error;
    }

    // If confirming, reduce available seats
    if (status === 'confirmed') {
      const { error: updateSeatsError } = await supabase
        .from('rides')
        .update({ available_seats: ride.available_seats - 1 })
        .eq('id', booking.ride_id);

      if (updateSeatsError) {
        throw updateSeatsError;
      }
    }

    // Get driver name
    const { data: driver } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sessionData.session.user.id)
      .single();

    // Send notification to the passenger
    await createNotification(
      booking.passenger_id,
      status === 'confirmed' ? 'Ride Booking Confirmed' : 'Ride Booking Cancelled',
      status === 'confirmed'
        ? `Your ride request from ${ride.from_location} to ${ride.to_location} has been accepted by ${driver?.full_name || 'the driver'}.`
        : `Your ride request from ${ride.from_location} to ${ride.to_location} has been declined by ${driver?.full_name || 'the driver'}.`,
      `booking_${status}`,
      booking.ride_id
    );

    toast.success(`Booking ${status === 'confirmed' ? 'confirmed' : 'cancelled'} successfully`);
    return true;
  } catch (error) {
    console.error('Error updating booking status:', error);
    toast.error('Failed to update booking status');
    return false;
  }
}

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
