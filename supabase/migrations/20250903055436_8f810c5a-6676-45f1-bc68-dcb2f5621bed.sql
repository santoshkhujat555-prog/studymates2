-- Add user_code column and invitation system (skip constraint for now)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_code TEXT UNIQUE;

-- Create user invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  lobby_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + '10 minutes'::interval),
  UNIQUE(from_user_id, to_user_id, lobby_id)
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view invitations sent to them or by them" 
ON public.user_invitations 
FOR SELECT 
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create invitations for their lobbies" 
ON public.user_invitations 
FOR INSERT 
WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update invitation status" 
ON public.user_invitations 
FOR UPDATE 
USING (to_user_id = auth.uid());

-- Create function to generate 6-digit user codes
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- Create trigger function for user codes
CREATE OR REPLACE FUNCTION public.set_user_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.user_code IS NULL THEN
    NEW.user_code = generate_user_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS set_profile_user_code ON public.profiles;
CREATE TRIGGER set_profile_user_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_code();

-- Update existing profiles
UPDATE public.profiles 
SET user_code = generate_user_code()
WHERE user_code IS NULL;