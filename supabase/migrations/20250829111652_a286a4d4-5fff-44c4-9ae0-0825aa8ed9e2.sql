-- Enhance profiles table with academic information from wireframes
ALTER TABLE public.profiles 
ADD COLUMN university_name TEXT,
ADD COLUMN branch_course TEXT,
ADD COLUMN skills TEXT[],
ADD COLUMN competitive_exam TEXT,
ADD COLUMN career_goal TEXT,
ADD COLUMN visibility BOOLEAN DEFAULT true,
ADD COLUMN mobile_number TEXT;