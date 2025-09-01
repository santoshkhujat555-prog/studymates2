import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  university_name: string | null;
  branch_course: string | null;
  skills: string[] | null;
  interests: string[] | null;
  stream: string | null;
  sub_stream: string | null;
}

export const useProfileMatch = () => {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [viewedProfiles, setViewedProfiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchRandomProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all profiles except current user and already viewed
      const viewedArray = Array.from(viewedProfiles);
      const excludeIds = [user.id, ...viewedArray];
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .not('user_id', 'in', `(${excludeIds.join(',')})`)
        .eq('visibility', true)
        .limit(50); // Get up to 50 profiles to randomize from

      if (error) {
        console.error('Error fetching profiles:', error);
        toast.error('Failed to load profiles');
        return;
      }

      if (!profiles || profiles.length === 0) {
        setCurrentProfile(null);
        return;
      }

      // Pick a random profile from the available ones
      const randomIndex = Math.floor(Math.random() * profiles.length);
      const randomProfile = profiles[randomIndex];
      
      setCurrentProfile(randomProfile);
    } catch (error) {
      console.error('Error in fetchRandomProfile:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user, viewedProfiles]);

  const loadNextProfile = useCallback(() => {
    if (currentProfile) {
      setViewedProfiles(prev => new Set([...prev, currentProfile.user_id]));
    }
    fetchRandomProfile();
  }, [currentProfile, fetchRandomProfile]);

  const likeProfile = useCallback(async (profileUserId: string) => {
    if (!user) return;

    try {
      // Here you could implement a matches table to store likes
      // For now, we'll just show a toast and load next profile
      toast.success('Profile liked! 💖');
      
      // Add to viewed profiles and load next
      setViewedProfiles(prev => new Set([...prev, profileUserId]));
      await fetchRandomProfile();
    } catch (error) {
      console.error('Error liking profile:', error);
      toast.error('Failed to like profile');
    }
  }, [user, fetchRandomProfile]);

  const passProfile = useCallback(async (profileUserId: string) => {
    try {
      // Add to viewed profiles and load next
      setViewedProfiles(prev => new Set([...prev, profileUserId]));
      await fetchRandomProfile();
    } catch (error) {
      console.error('Error passing profile:', error);
      toast.error('Failed to skip profile');
    }
  }, [fetchRandomProfile]);

  // Load initial profile
  useEffect(() => {
    if (user) {
      fetchRandomProfile();
    }
  }, [user, fetchRandomProfile]);

  return {
    currentProfile,
    loadNextProfile,
    likeProfile,
    passProfile,
    loading
  };
};