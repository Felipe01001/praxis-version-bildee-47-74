-- Criar tabela legislacoes para armazenar normas jurídicas do LexML
CREATE TABLE IF NOT EXISTS public.legislacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  numero TEXT NOT NULL,
  ano TEXT NOT NULL,
  titulo TEXT,
  ementa TEXT,
  orgao_emissor TEXT,
  data_publicacao DATE,
  link_lexml TEXT,
  xml_bruto TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.legislacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Users can view their own saved legislation" 
ON public.legislacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own legislation" 
ON public.legislacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legislation" 
ON public.legislacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own legislation" 
ON public.legislacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_legislacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_legislacoes_updated_at
  BEFORE UPDATE ON public.legislacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_legislacoes_updated_at();