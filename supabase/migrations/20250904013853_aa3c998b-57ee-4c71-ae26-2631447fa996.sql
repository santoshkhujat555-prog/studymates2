-- First, let's clear all existing lobbies to avoid constraint issues
DELETE FROM public.lobby_members;
DELETE FROM public.lobbies;

-- Drop any existing constraints
ALTER TABLE public.lobbies DROP CONSTRAINT IF EXISTS lobbies_lobby_type_check;

-- Add the correct check constraint
ALTER TABLE public.lobbies 
ADD CONSTRAINT lobbies_lobby_type_check 
CHECK (lobby_type IN ('quiz-2', 'quiz-4'));