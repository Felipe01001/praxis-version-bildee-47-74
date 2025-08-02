
-- Adicionar colunas de estado e cidade na tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN state text,
ADD COLUMN city text;

-- Atualizar a função handle_new_user para incluir estado e cidade
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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
