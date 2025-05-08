
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Rating {
  id: string;
  ride_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export async function rateUser(rideId: string, ratedId: string, rating: number, comment: string | null = null) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.user) {
      toast.error('You must be logged in to rate users');
      return false;
    }

    const { error } = await supabase
      .from('ratings')
      .insert({
        ride_id: rideId,
        rater_id: sessionData.session.user.id,
        rated_id: ratedId,
        rating,
        comment
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast.error('You have already rated this user for this ride');
      } else {
        throw error;
      }
      return false;
    }

    toast.success('Rating submitted successfully');
    
    // Update the user's average rating
    await updateUserAverageRating(ratedId);
    
    return true;
  } catch (error) {
    console.error('Error submitting rating:', error);
    toast.error('Failed to submit rating');
    return false;
  }
}

export async function getUserRatings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        rater:profiles!rater_id(full_name)
      `)
      .eq('rated_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    toast.error('Failed to load ratings');
    return [];
  }
}

async function updateUserAverageRating(userId: string) {
  try {
    // Get all ratings for this user
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('rated_id', userId);

    if (error) {
      throw error;
    }

    // Calculate average rating
    const total = ratings.reduce((sum, item) => sum + item.rating, 0);
    const average = ratings.length > 0 ? total / ratings.length : null;

    // Update user profile
    await supabase
      .from('profiles')
      .update({
        rating: average !== null ? parseFloat(average.toFixed(2)) : null
      })
      .eq('id', userId);

  } catch (error) {
    console.error('Error updating user average rating:', error);
  }
}
