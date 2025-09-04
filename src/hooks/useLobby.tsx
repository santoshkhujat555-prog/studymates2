import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Lobby {
  id: string;
  created_by: string;
  lobby_type: 'quiz-2' | 'quiz-4';
  max_players: number;
  current_players: number;
  status: 'waiting' | 'full' | 'active' | 'completed';
  created_at: string;
  expires_at: string;
  invite_code?: string;
  is_private?: boolean;
}

export interface LobbyMember {
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
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [lobbyMembers, setLobbyMembers] = useState<LobbyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create private lobby
  const createPrivateLobby = useCallback(async (lobbyType: string, maxPlayers: number) => {
    if (!user) {
      toast.error('You must be logged in to create a lobby');
      return null;
    }

    setIsLoading(true);
    try {
      // Create new private lobby
      const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .insert({
          created_by: user.id,
          lobby_type: lobbyType,
          max_players: maxPlayers,
          is_private: true,
        })
        .select()
        .single();

      if (lobbyError) {
        console.error('Error creating lobby:', lobbyError);
        throw lobbyError;
      }

      // Join the created lobby
      const { error: memberError } = await supabase
        .from('lobby_members')
        .insert({
          lobby_id: lobby.id,
          user_id: user.id,
        });

      if (memberError) {
        console.error('Error joining created lobby:', memberError);
        await supabase.from('lobbies').delete().eq('id', lobby.id);
        throw memberError;
      }

      setCurrentLobby(lobby as Lobby);
      toast.success('Private lobby created! Share the invite code to add players.');
      return lobby as Lobby;
    } catch (error) {
      console.error('Error creating private lobby:', error);
      toast.error('Failed to create private lobby');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Join lobby by user invitation (accept invitation)
  const acceptInvitation = useCallback(async (invitationId: string) => {
    if (!user) {
      toast.error('You must be logged in to accept invitation');
      return null;
    }

    setIsLoading(true);
    try {
      // Update invitation status and get lobby info
      const { data: invitation, error: updateError } = await supabase
        .from('user_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)
        .eq('to_user_id', user.id)
        .select('lobby_id, lobbies(*)')
        .single();

      if (updateError) throw updateError;

      // Join the lobby
      const { error: memberError } = await supabase
        .from('lobby_members')
        .insert({
          lobby_id: invitation.lobby_id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      const lobby = (invitation as any).lobbies;
      setCurrentLobby(lobby as Lobby);
      toast.success('Successfully joined the lobby!');
      return lobby as Lobby;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to join lobby');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Find existing lobby or create new one
  const findOrCreateLobby = useCallback(async (lobbyType: string, maxPlayers: number) => {
    if (!user) {
      toast.error('You must be logged in to create a lobby');
      return null;
    }

    setIsLoading(true);
    try {
      // First, try to find an existing waiting lobby of the same type
      const { data: existingLobbies } = await supabase
        .from('lobbies')
        .select('*')
        .eq('lobby_type', lobbyType)
        .eq('status', 'waiting')
        .eq('is_private', false)
        .lt('current_players', maxPlayers)
        .order('created_at', { ascending: true });

      if (existingLobbies && existingLobbies.length > 0) {
        // Join existing lobby
        const lobby = existingLobbies[0];
        const { error: memberError } = await supabase
          .from('lobby_members')
          .insert({
            lobby_id: lobby.id,
            user_id: user.id,
          });

        if (memberError) {
          if (memberError.code === '23505') { // Already in lobby
            setCurrentLobby(lobby as Lobby);
            toast.success('Rejoined existing lobby!');
            return lobby as Lobby;
          }
          throw memberError;
        }

        setCurrentLobby(lobby as Lobby);
        toast.success('Joined existing lobby!');
        return lobby;
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

      if (lobbyError) {
        console.error('Error creating lobby:', lobbyError);
        throw lobbyError;
      }

      // Join the created lobby
      const { error: memberError } = await supabase
        .from('lobby_members')
        .insert({
          lobby_id: lobby.id,
          user_id: user.id,
        });

      if (memberError) {
        console.error('Error joining created lobby:', memberError);
        // If joining failed, try to delete the lobby to avoid orphaned lobbies
        await supabase.from('lobbies').delete().eq('id', lobby.id);
        throw memberError;
      }

      setCurrentLobby(lobby as Lobby);
      toast.success('Lobby created! Waiting for other players...');
      return lobby as Lobby;
    } catch (error) {
      console.error('Error creating/joining lobby:', error);
      toast.error('Failed to create lobby');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Send user invitation
  const sendUserInvitation = useCallback(async (userCode: string, lobbyId: string) => {
    if (!user) {
      toast.error('You must be logged in to send invitations');
      return false;
    }
    
    setIsLoading(true);
    try {
      // Find user by 6-digit code
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_code', userCode)
        .single();

      if (userError || !targetUser) {
        toast.error('User not found with this code');
        return false;
      }

      // Create invitation
      const { error } = await supabase
        .from('user_invitations')
        .insert({
          from_user_id: user.id,
          to_user_id: targetUser.user_id,
          lobby_id: lobbyId
        });

      if (error) {
        console.error('Error sending invitation:', error);
        toast.error('Failed to send invitation');
        return false;
      }

      toast.success('Invitation sent successfully!');
      return true;
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
      toast.success('Left lobby');
    } catch (error) {
      console.error('Error leaving lobby:', error);
      toast.error('Failed to leave lobby');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentLobby]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentLobby) return;

    // Subscribe to lobby updates
    const lobbyChannel = supabase
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
            setCurrentLobby(payload.new as Lobby);
            
            // Notify when lobby is full
            if ((payload.new as Lobby).status === 'full') {
              toast.success('Lobby is full! Ready to start!');
            }
          } else if (payload.eventType === 'DELETE') {
            setCurrentLobby(null);
            setLobbyMembers([]);
            toast.info('Lobby was closed');
          }
        }
      )
      .subscribe();

    // Subscribe to lobby member updates
    const membersChannel = supabase
      .channel('lobby-members-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${currentLobby.id}`,
        },
        async () => {
          // Fetch updated member list
          const { data: members } = await supabase
            .from('lobby_members')
            .select(`
              *,
              profiles (
                full_name,
                avatar_url
              )
            `)
            .eq('lobby_id', currentLobby.id);

          if (members) {
            setLobbyMembers(members as LobbyMember[]);
          }
        }
      )
      .subscribe();

    // Initial fetch of lobby members
    const fetchMembers = async () => {
      const { data: members } = await supabase
        .from('lobby_members')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('lobby_id', currentLobby.id);

      if (members) {
        setLobbyMembers(members as LobbyMember[]);
      }
    };

    fetchMembers();

    return () => {
      supabase.removeChannel(lobbyChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [currentLobby]);

  // Check if user is already in a lobby on mount
  useEffect(() => {
    if (!user) return;

    const checkExistingLobby = async () => {
      const { data: memberData } = await supabase
        .from('lobby_members')
        .select('lobby_id, lobbies(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(1);

      if (memberData && memberData.length > 0) {
        const lobby = (memberData[0] as any).lobbies;
        if (lobby && (lobby.status === 'waiting' || lobby.status === 'full')) {
          setCurrentLobby(lobby as Lobby);
        }
      }
    };

    checkExistingLobby();
  }, [user]);

  return {
    currentLobby,
    lobbyMembers,
    isLoading,
    findOrCreateLobby,
    createPrivateLobby,
    acceptInvitation,
    leaveLobby,
    sendUserInvitation,
  };
};