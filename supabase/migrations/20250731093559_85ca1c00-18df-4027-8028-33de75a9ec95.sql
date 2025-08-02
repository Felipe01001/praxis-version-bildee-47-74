-- Fix security warnings: Set search_path for all functions
CREATE OR REPLACE FUNCTION check_subscription_expired(user_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT assinatura_ativa, proximo_pagamento 
  INTO profile_record
  FROM public.user_profiles 
  WHERE user_id = user_uuid;
  
  -- If no subscription record or inactive
  IF profile_record IS NULL OR NOT profile_record.assinatura_ativa THEN
    RETURN true;
  END IF;
  
  -- If no next payment date set, consider expired
  IF profile_record.proximo_pagamento IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if expired (past next payment date)
  IF profile_record.proximo_pagamento < now() THEN
    -- Auto-deactivate expired subscription
    UPDATE public.user_profiles 
    SET assinatura_ativa = false, updated_at = now()
    WHERE user_id = user_uuid;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION validate_payment_before_activation(p_user_id UUID, p_subscription_id TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  payment_count INTEGER;
BEGIN
  -- Check if there's a confirmed payment for this subscription
  SELECT COUNT(*) INTO payment_count
  FROM public.pagamentos 
  WHERE user_id = p_user_id 
    AND assinatura_id = p_subscription_id 
    AND status = 'confirmed';
    
  RETURN payment_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION validate_subscription_activation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Only validate when setting assinatura_ativa to true
  IF NEW.assinatura_ativa = true AND (OLD.assinatura_ativa IS NULL OR OLD.assinatura_ativa = false) THEN
    -- Require subscription_id for activation
    IF NEW.assinatura_id IS NULL OR NEW.assinatura_id = '' THEN
      RAISE EXCEPTION 'Subscription ID is required for activation';
    END IF;
    
    -- Don't allow test subscriptions in production
    IF NEW.assinatura_id LIKE 'test_%' THEN
      RAISE EXCEPTION 'Test subscriptions are not allowed';
    END IF;
    
    -- Validate payment exists (only for non-system updates)
    IF NOT validate_payment_before_activation(NEW.user_id, NEW.assinatura_id) THEN
      RAISE EXCEPTION 'No confirmed payment found for subscription %', NEW.assinatura_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, phone, state, city)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'state',
    new.raw_user_meta_data ->> 'city'
  );
  RETURN new;
END;
$$;