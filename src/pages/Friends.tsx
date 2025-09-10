import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';

interface FriendProfile {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  university_name?: string;
}

const Friends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchFriends = async () => {
      // Get all friend connections
      const { data: friendConnections, error } = await supabase
        .from('friends')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) {
        console.error(error);
        return;
      }

      if (!friendConnections || friendConnections.length === 0) {
        setFriends([]);
        return;
      }

      // Extract IDs of friends
      const friendIds = friendConnections.map(conn =>
        conn.user1_id === user.id ? conn.user2_id : conn.user1_id
      );

      // Fetch friend profiles
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, university_name')
        .in('user_id', friendIds);

      if (friendProfiles) setFriends(friendProfiles);
    };

    fetchFriends();
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">My Friends</h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </header>

      {/* Friends List */}
      <div className="container mx-auto px-4 py-8 max-w-md space-y-4">
        {friends.length > 0 ? (
          friends.map((f) => (
            <Card key={f.user_id} className="p-4 flex items-center space-x-4">
              {f.avatar_url ? (
                <img
                  src={f.avatar_url}
                  alt={f.full_name || 'User'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h2 className="font-bold">{f.full_name || 'Anonymous'}</h2>
                {f.university_name && (
                  <p className="text-sm text-muted-foreground">{f.university_name}</p>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No friends yet. Keep liking profiles!</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Friends;
