-- Add administrative approval fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN aprovado_por_admin boolean DEFAULT false,
ADD COLUMN data_aprovacao timestamp with time zone,
ADD COLUMN aprovado_por_user_id uuid,
ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add index for better performance on role queries
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_aprovado ON public.user_profiles(aprovado_por_admin);

-- Create audit log table for administrative actions
CREATE TABLE public.admin_audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id uuid NOT NULL,
    target_user_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for audit log
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    target_user_id,
    action,
    details
  ) VALUES (
    p_admin_user_id,
    p_target_user_id,
    p_action,
    p_details
  );
END;
$$;

-- Update validation function to include admin approval
CREATE OR REPLACE FUNCTION public.check_user_access(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = user_uuid AND role = 'admin'
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = user_uuid 
        AND assinatura_ativa = true 
        AND aprovado_por_admin = true
        AND (proximo_pagamento IS NULL OR proximo_pagamento > now())
      ) THEN true
      ELSE false
    END;
$$;