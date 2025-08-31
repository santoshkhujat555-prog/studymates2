-- Fix the lobby member count trigger to properly update current_players
CREATE OR REPLACE FUNCTION public.update_lobby_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the lobby's current_players count and status
  UPDATE public.lobbies 
  SET 
    current_players = (
      SELECT COUNT(*) 
      FROM public.lobby_members 
      WHERE lobby_id = COALESCE(NEW.lobby_id, OLD.lobby_id)
    ),
    status = CASE 
      WHEN (SELECT COUNT(*) FROM public.lobby_members WHERE lobby_id = COALESCE(NEW.lobby_id, OLD.lobby_id)) >= max_players THEN 'full'
      WHEN (SELECT COUNT(*) FROM public.lobby_members WHERE lobby_id = COALESCE(NEW.lobby_id, OLD.lobby_id)) > 0 THEN 'waiting'
      ELSE 'waiting'
    END
  WHERE id = COALESCE(NEW.lobby_id, OLD.lobby_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_lobby_count_trigger ON public.lobby_members;

-- Create the trigger for both INSERT and DELETE
CREATE TRIGGER update_lobby_count_trigger
  AFTER INSERT OR DELETE ON public.lobby_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lobby_count();

-- Fix existing lobbies by recalculating their member counts
UPDATE public.lobbies 
SET 
  current_players = (
    SELECT COUNT(*) 
    FROM public.lobby_members 
    WHERE lobby_id = lobbies.id
  ),
  status = CASE 
    WHEN (SELECT COUNT(*) FROM public.lobby_members WHERE lobby_id = lobbies.id) >= max_players THEN 'full'
    WHEN (SELECT COUNT(*) FROM public.lobby_members WHERE lobby_id = lobbies.id) > 0 THEN 'waiting'
    ELSE 'waiting'
  END;