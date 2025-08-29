-- Enhance profiles table with academic information from wireframes
ALTER TABLE public.profiles 
ADD COLUMN university_name TEXT,
ADD COLUMN branch_course TEXT,
ADD COLUMN skills TEXT[],
ADD COLUMN competitive_exam TEXT,
ADD COLUMN career_goal TEXT,
ADD COLUMN visibility BOOLEAN DEFAULT true,
ADD COLUMN mobile_number TEXT;

-- Update the trigger to handle the updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();