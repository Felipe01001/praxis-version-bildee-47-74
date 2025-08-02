-- Atualizar função de verificação de acesso do usuário
-- Remover dependência de aprovação administrativa para usuários pagantes
CREATE OR REPLACE FUNCTION public.check_user_access(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        AND (proximo_pagamento IS NULL OR proximo_pagamento > now())
      ) THEN true
      ELSE false
    END;
$function$