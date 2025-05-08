
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createNotification } from '../notificationService';

export async function bookRide(rideId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.user) {
      toast.error('You must be logged in to book a ride');
      return false;
    }

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

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('available_seats, driver_id')
      .eq('id', rideId)
      .single();

    if (rideError) {
      throw rideError;
    }

    if (ride.driver_id === sessionData.session.user.id) {
      toast.error('You cannot book your own ride');
      return false;
    }

    if (ride.available_seats <= 0) {
      toast.error('No seats available for this ride');
      return false;
    }

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

    const { data: passenger } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sessionData.session.user.id)
      .single();

    const { data: rideDetails } = await supabase
      .from('rides')
      .select('from_location, to_location')
      .eq('id', rideId)
      .single();
      
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

    const { data: bookingData, error: bookingQueryError } = await supabase
      .from('ride_passengers')
      .select(`
        id,
        ride_id,
        passenger_id,
        status,
        passenger:profiles(full_name)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingQueryError) {
      throw bookingQueryError;
    }

    if (bookingData.status === status) {
      toast.info(`Booking is already ${status}`);
      return true;
    }

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('driver_id, from_location, to_location, available_seats')
      .eq('id', bookingData.ride_id)
      .single();

    if (rideError) {
      throw rideError;
    }

    if (ride.driver_id !== sessionData.session.user.id) {
      toast.error('Only the driver can update booking status');
      return false;
    }

    if (status === 'confirmed' && ride.available_seats <= 0) {
      toast.error('Cannot confirm booking: No seats available');
      return false;
    }

    const { error: updateError } = await supabase
      .from('ride_passengers')
      .update({ status })
      .eq('id', bookingId);

    if (updateError) {
      throw updateError;
    }

    if (status === 'confirmed') {
      const { error: updateSeatsError } = await supabase
        .from('rides')
        .update({ available_seats: ride.available_seats - 1 })
        .eq('id', bookingData.ride_id);
        
      if (updateSeatsError) {
        throw updateSeatsError;
      }
    }

    const { data: driver } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', sessionData.session.user.id)
      .single();

    await createNotification(
      bookingData.passenger_id,
      status === 'confirmed' ? 'Ride Booking Confirmed' : 'Ride Booking Cancelled',
      status === 'confirmed' 
        ? `Your ride request from ${ride.from_location} to ${ride.to_location} has been accepted by ${driver?.full_name || 'the driver'}.`
        : `Your ride request from ${ride.from_location} to ${ride.to_location} has been declined by ${driver?.full_name || 'the driver'}.`,
      `booking_${status}`,
      bookingData.ride_id
    );

    toast.success(`Booking ${status === 'confirmed' ? 'confirmed' : 'cancelled'} successfully`);
    return true;
  } catch (error) {
    console.error('Error updating booking status:', error);
    toast.error('Failed to update booking status');
    return false;
  }
}
