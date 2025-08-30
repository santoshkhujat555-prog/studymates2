-- Create lobbies table for real-time matching
CREATE TABLE public.lobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  lobby_type TEXT NOT NULL CHECK (lobby_type IN ('study-match-2', 'study-match-4', 'peer-review-2', 'collaborative-4')),
  max_players INTEGER NOT NULL CHECK (max_players IN (2, 4)),
  current_players INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'full', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes')
);

-- Create lobby_members table to track who's in each lobby
CREATE TABLE public.lobby_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lobby_id, user_id)
);

-- Enable RLS
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for lobbies
CREATE POLICY "Anyone can view active lobbies" 
ON public.lobbies 
FOR SELECT 
USING (status = 'waiting' OR created_by = auth.uid());

CREATE POLICY "Users can create lobbies" 
ON public.lobbies 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own lobbies" 
ON public.lobbies 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS policies for lobby_members
CREATE POLICY "Anyone can view lobby members" 
ON public.lobby_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join lobbies" 
ON public.lobby_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave lobbies" 
ON public.lobby_members 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for lobby matching
ALTER TABLE public.lobbies REPLICA IDENTITY FULL;
ALTER TABLE public.lobby_members REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_members;

-- Function to automatically update lobby status when members join/leave
CREATE OR REPLACE FUNCTION update_lobby_status() 
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_players count and status
  UPDATE public.lobbies 
  SET 
    current_players = (
      SELECT COUNT(*) 
      FROM public.lobby_members 
      WHERE lobby_id = COALESCE(NEW.lobby_id, OLD.lobby_id)
    ),
    status = CASE 
      WHEN (SELECT COUNT(*) FROM public.lobby_members WHERE lobby_id = COALESCE(NEW.lobby_id, OLD.lobby_id)) >= max_players THEN 'full'
      ELSE 'waiting'
    END
  WHERE id = COALESCE(NEW.lobby_id, OLD.lobby_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating lobby status
CREATE TRIGGER trigger_update_lobby_status_on_insert
AFTER INSERT ON public.lobby_members
FOR EACH ROW EXECUTE FUNCTION update_lobby_status();

CREATE TRIGGER trigger_update_lobby_status_on_delete  
AFTER DELETE ON public.lobby_members
FOR EACH ROW EXECUTE FUNCTION update_lobby_status();

-- Function to clean up expired lobbies
CREATE OR REPLACE FUNCTION cleanup_expired_lobbies()
RETURNS void AS $$
BEGIN
  DELETE FROM public.lobbies 
  WHERE expires_at < now() AND status = 'waiting';
END;
$$ LANGUAGE plpgsql;