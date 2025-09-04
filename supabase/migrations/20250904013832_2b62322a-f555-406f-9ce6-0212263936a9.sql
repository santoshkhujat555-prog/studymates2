-- Clear all existing lobby data to start fresh
DELETE FROM public.lobby_members;
DELETE FROM public.user_invitations;
DELETE FROM public.lobbies;

-- Drop the existing constraint if it exists
ALTER TABLE public.lobbies 
DROP CONSTRAINT IF EXISTS lobbies_lobby_type_check;

-- Add the correct check constraint for lobby types
ALTER TABLE public.lobbies 
ADD CONSTRAINT lobbies_lobby_type_check 
CHECK (lobby_type IN ('quiz-2', 'quiz-4'));