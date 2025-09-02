-- Add invitation functionality to lobbies
ALTER TABLE public.lobbies 
ADD COLUMN invite_code TEXT UNIQUE,
ADD COLUMN is_private BOOLEAN DEFAULT false;

-- Create invitations table
CREATE TABLE public.lobby_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on invitations table
ALTER TABLE public.lobby_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Users can view invitations sent to them or by them" 
ON public.lobby_invitations 
FOR SELECT 
USING (inviter_id = auth.uid() OR invitee_email = auth.email());

CREATE POLICY "Users can create invitations for their lobbies" 
ON public.lobby_invitations 
FOR INSERT 
WITH CHECK (
  inviter_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.lobbies 
    WHERE id = lobby_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can update invitation status" 
ON public.lobby_invitations 
FOR UPDATE 
USING (invitee_email = auth.email() OR inviter_id = auth.uid());

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code() 
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Update lobbies to auto-generate invite codes
CREATE OR REPLACE FUNCTION set_lobby_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code = generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_lobby_invite_code_trigger
  BEFORE INSERT ON public.lobbies
  FOR EACH ROW
  EXECUTE FUNCTION set_lobby_invite_code();