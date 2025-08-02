-- Phase 1: Security and Data Cleanup
-- Reset all test subscriptions without valid payments
UPDATE user_profiles 
SET assinatura_ativa = false, 
    assinatura_id = NULL,
    data_assinatura = NULL,
    proximo_pagamento = NULL,
    updated_at = now()
WHERE assinatura_ativa = true 
  AND (assinatura_id IS NULL OR assinatura_id = '' OR assinatura_id LIKE 'test_%');

-- Add expiration check function
CREATE OR REPLACE FUNCTION check_subscription_expired(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT assinatura_ativa, proximo_pagamento 
  INTO profile_record
  FROM user_profiles 
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
    UPDATE user_profiles 
    SET assinatura_ativa = false, updated_at = now()
    WHERE user_id = user_uuid;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add payment validation function
CREATE OR REPLACE FUNCTION validate_payment_before_activation(p_user_id UUID, p_subscription_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  payment_count INTEGER;
BEGIN
  -- Check if there's a confirmed payment for this subscription
  SELECT COUNT(*) INTO payment_count
  FROM pagamentos 
  WHERE user_id = p_user_id 
    AND assinatura_id = p_subscription_id 
    AND status = 'confirmed';
    
  RETURN payment_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to validate subscription activation
CREATE OR REPLACE FUNCTION validate_subscription_activation()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for subscription validation
DROP TRIGGER IF EXISTS validate_subscription_trigger ON user_profiles;
CREATE TRIGGER validate_subscription_trigger
  BEFORE UPDATE OF assinatura_ativa ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_activation();

-- Add subscription status tracking
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id TEXT,
  event_type TEXT NOT NULL, -- 'created', 'activated', 'deactivated', 'expired'
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on subscription_events
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Create policy for subscription_events
CREATE POLICY "Users can view their own subscription events" 
ON subscription_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscription events" 
ON subscription_events FOR INSERT 
WITH CHECK (true);