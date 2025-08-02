-- Adicionar colunas de assinatura na tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS assinatura_ativa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS assinatura_id text,
ADD COLUMN IF NOT EXISTS data_assinatura timestamp with time zone,
ADD COLUMN IF NOT EXISTS proximo_pagamento timestamp with time zone;

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assinatura_id text,
  valor numeric(10,2),
  metodo_pagamento text,
  status text,
  efi_charge_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela pagamentos
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pagamentos
CREATE POLICY "Users can view their own payments" ON public.pagamentos
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert payments" ON public.pagamentos
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.pagamentos
FOR UPDATE USING (true);

-- Trigger para atualizar updated_at na tabela pagamentos
CREATE OR REPLACE FUNCTION public.update_pagamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pagamentos_updated_at
    BEFORE UPDATE ON public.pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_pagamentos_updated_at();