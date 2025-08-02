-- Permitir que client_id seja nulo na tabela judicial_processes
ALTER TABLE public.judicial_processes 
ALTER COLUMN client_id DROP NOT NULL;