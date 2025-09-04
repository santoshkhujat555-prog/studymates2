-- Update the lobby_type check constraint to allow the correct values
ALTER TABLE public.lobbies 
DROP CONSTRAINT IF EXISTS lobbies_lobby_type_check;

-- Add the correct check constraint for lobby types
ALTER TABLE public.lobbies 
ADD CONSTRAINT lobbies_lobby_type_check 
CHECK (lobby_type IN ('quiz-2', 'quiz-4'));