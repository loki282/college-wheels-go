
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  university: string | null;
  role: 'rider' | 'driver' | 'both';
  rating: number | null;
  total_rides: number;
  is_verified: boolean | null;
}

export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    toast.error('Failed to load profile data');
    return null;
  }
}

export async function updateProfile(profile: Partial<Profile> & { id: string }) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', profile.id);

    if (error) {
      throw error;
    }

    toast.success('Profile updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile');
    return false;
  }
}

export async function getCurrentUserProfile() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.user) {
      return null;
    }
    
    return getProfile(sessionData.session.user.id);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }
}
