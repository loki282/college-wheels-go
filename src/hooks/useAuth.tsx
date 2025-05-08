
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { getCurrentUserProfile } from '@/services/profileService';
import { Profile } from '@/services/profileService';

export function useAuth() {
  const { session, user, signIn, signUp, signOut } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (user) {
      const profileData = await getCurrentUserProfile();
      setProfile(profileData);
    } else {
      setProfile(null);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile: loadProfile
  };
}
