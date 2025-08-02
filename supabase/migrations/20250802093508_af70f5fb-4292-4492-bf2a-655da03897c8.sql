-- Add CPF field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN cpf TEXT;

-- Create index for CPF (optional, for better performance)
CREATE INDEX idx_user_profiles_cpf ON public.user_profiles(cpf);