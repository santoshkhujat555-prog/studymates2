-- First, update existing lobby types to match our new format
UPDATE public.lobbies 
SET lobby_type = CASE 
  WHEN lobby_type LIKE '%2' OR lobby_type LIKE '%2%' THEN 'quiz-2'
  WHEN lobby_type LIKE '%4' OR lobby_type LIKE '%4%' THEN 'quiz-4'
  ELSE 'quiz-2'
END;

-- Drop the existing constraint if it exists
ALTER TABLE public.lobbies 
DROP CONSTRAINT IF EXISTS lobbies_lobby_type_check;

-- Add the correct check constraint for lobby types
ALTER TABLE public.lobbies 
ADD CONSTRAINT lobbies_lobby_type_check 
CHECK (lobby_type IN ('quiz-2', 'quiz-4'));