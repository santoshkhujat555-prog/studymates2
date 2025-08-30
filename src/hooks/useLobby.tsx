import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LobbyData {
  id: string;
  created_by: string;
  lobby_type: string;
  max_players: number;
  current_players: number;
  status: 'waiting' | 'full' | 'active' | 'completed';
  created_at: string;
  expires_at: string;
}

interface LobbyMember {
  id: string;
  lobby_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
}

export const useLobby = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentLobby, setCurrentLobby] = useState<LobbyData | null>(null);
  const [lobbyMembers, setLobbyMembers] = useState<LobbyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create a new lobby
  const createLobby = useCallback(async (lobbyType: string, maxPlayers: number) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      // First check if user is already in a lobby
      const { data: existingMember } = await supabase
        .from('lobby_members')
        .select('lobby_id, lobbies(*)')
        .eq('user_id', user.id)
        .eq('lobbies.status', 'waiting')
        .single();

      if (existingMember) {
        toast({
          title: "Already in lobby",
          description: "You're already in a waiting lobby. Leave it first to create a new one.",
        });
        setCurrentLobby(existingMember.lobbies as LobbyData);
        return existingMember.lobbies as LobbyData;
      }

      // Create new lobby
      const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .insert({
          created_by: user.id,
          lobby_type: lobbyType,
          max_players: maxPlayers,
        })
        .select()
        .single();

      if (lobbyError) throw lobbyError;

      // Add creator to lobby members
      const { error: memberError } = await supabase
        .from('lobby_members')
        .insert({
          lobby_id: lobby.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      setCurrentLobby(lobby as LobbyData);
      toast({
        title: "Lobby created!",
        description: `Waiting for ${maxPlayers - 1} more player${maxPlayers > 2 ? 's' : ''}...`,
      });

      return lobby as LobbyData;
    } catch (error) {
      console.error('Error creating lobby:', error);
      toast({
        title: "Error",
        description: "Failed to create lobby. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Join an existing lobby
  const joinLobby = useCallback(async (lobbyId: string) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('lobby_members')
        .insert({
          lobby_id: lobbyId,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Joined lobby!",
        description: "You've successfully joined the lobby.",
      });

      return true;
    } catch (error: any) {
      console.error('Error joining lobby:', error);
      if (error.code === '23505') {
        toast({
          title: "Already in lobby",
          description: "You're already a member of this lobby.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to join lobby. Please try again.",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Leave current lobby
  const leaveLobby = useCallback(async () => {
    if (!user || !currentLobby) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('lobby_members')
        .delete()
        .eq('lobby_id', currentLobby.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCurrentLobby(null);
      setLobbyMembers([]);

      toast({
        title: "Left lobby",
        description: "You've left the lobby successfully.",
      });
    } catch (error) {
      console.error('Error leaving lobby:', error);
      toast({
        title: "Error",
        description: "Failed to leave lobby. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, currentLobby, toast]);

  // Find and join available lobby or create new one
  const findOrCreateLobby = useCallback(async (lobbyType: string, maxPlayers: number) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      // First try to find an available lobby
      const { data: availableLobbies } = await supabase
        .from('lobbies')
        .select('*')
        .eq('lobby_type', lobbyType)
        .eq('status', 'waiting')
        .lt('current_players', maxPlayers)
        .order('created_at', { ascending: true })
        .limit(1);

      if (availableLobbies && availableLobbies.length > 0) {
        const success = await joinLobby(availableLobbies[0].id);
        if (success) {
          setCurrentLobby(availableLobbies[0] as LobbyData);
          return availableLobbies[0] as LobbyData;
        }
      }

      // If no available lobby, create a new one
      return await createLobby(lobbyType, maxPlayers);
    } catch (error) {
      console.error('Error finding or creating lobby:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, joinLobby, createLobby]);

  // Load lobby members
  const loadLobbyMembers = useCallback(async (lobbyId: string) => {
    try {
      const { data, error } = await supabase
        .from('lobby_members')
        .select(`
          *,
          profiles!lobby_members_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('lobby_id', lobbyId);

      if (error) throw error;
      setLobbyMembers((data || []) as LobbyMember[]);
    } catch (error) {
      console.error('Error loading lobby members:', error);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentLobby) return;

    const channel = supabase
      .channel('lobby-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${currentLobby.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCurrentLobby(payload.new as LobbyData);
          } else if (payload.eventType === 'DELETE') {
            setCurrentLobby(null);
            setLobbyMembers([]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${currentLobby.id}`,
        },
        () => {
          loadLobbyMembers(currentLobby.id);
        }
      )
      .subscribe();

    // Load initial members
    loadLobbyMembers(currentLobby.id);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentLobby?.id, loadLobbyMembers]);

  // Check for existing lobby on mount
  useEffect(() => {
    if (!user) return;

    const checkExistingLobby = async () => {
      const { data } = await supabase
        .from('lobby_members')
        .select(`
          lobby_id, 
          lobbies!lobby_members_lobby_id_fkey (*)
        `)
        .eq('user_id', user.id)
        .eq('lobbies.status', 'waiting')
        .maybeSingle();

      if (data?.lobbies) {
        setCurrentLobby(data.lobbies as LobbyData);
      }
    };

    checkExistingLobby();
  }, [user]);

  return {
    currentLobby,
    lobbyMembers,
    isLoading,
    createLobby,
    joinLobby,
    leaveLobby,
    findOrCreateLobby,
  };
};