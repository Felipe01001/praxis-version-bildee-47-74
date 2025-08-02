-- Corrigir políticas RLS para a tabela clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = userId);

CREATE POLICY "Users can create their own clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() = userId);

-- Corrigir políticas RLS para a tabela cases
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can create their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON public.cases;

CREATE POLICY "Users can view their own cases" 
ON public.cases 
FOR SELECT 
USING (auth.uid() = userId);

CREATE POLICY "Users can create their own cases" 
ON public.cases 
FOR INSERT 
WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update their own cases" 
ON public.cases 
FOR UPDATE 
USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own cases" 
ON public.cases 
FOR DELETE 
USING (auth.uid() = userId);

-- Corrigir políticas RLS para a tabela tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = userId);

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() = userId);

-- Corrigir políticas RLS para a tabela attachments
DROP POLICY IF EXISTS "Users can view their own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can create their own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can update their own attachments" ON public.attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.attachments;

CREATE POLICY "Users can view their own attachments" 
ON public.attachments 
FOR SELECT 
USING (auth.uid() = userId);

CREATE POLICY "Users can create their own attachments" 
ON public.attachments 
FOR INSERT 
WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update their own attachments" 
ON public.attachments 
FOR UPDATE 
USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own attachments" 
ON public.attachments 
FOR DELETE 
USING (auth.uid() = userId);

-- Corrigir políticas RLS para a tabela petitions
DROP POLICY IF EXISTS "Users can view their own petitions" ON public.petitions;
DROP POLICY IF EXISTS "Users can create their own petitions" ON public.petitions;
DROP POLICY IF EXISTS "Users can update their own petitions" ON public.petitions;
DROP POLICY IF EXISTS "Users can delete their own petitions" ON public.petitions;

CREATE POLICY "Users can view their own petitions" 
ON public.petitions 
FOR SELECT 
USING (auth.uid() = userId);

CREATE POLICY "Users can create their own petitions" 
ON public.petitions 
FOR INSERT 
WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update their own petitions" 
ON public.petitions 
FOR UPDATE 
USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own petitions" 
ON public.petitions 
FOR DELETE 
USING (auth.uid() = userId);

-- Corrigir políticas RLS para a tabela judicial_processes
DROP POLICY IF EXISTS "Users can view their own judicial_processes" ON public.judicial_processes;
DROP POLICY IF EXISTS "Users can create their own judicial_processes" ON public.judicial_processes;
DROP POLICY IF EXISTS "Users can update their own judicial_processes" ON public.judicial_processes;
DROP POLICY IF EXISTS "Users can delete their own judicial_processes" ON public.judicial_processes;

CREATE POLICY "Users can view their own judicial_processes" 
ON public.judicial_processes 
FOR SELECT 
USING (auth.uid() = userId);

CREATE POLICY "Users can create their own judicial_processes" 
ON public.judicial_processes 
FOR INSERT 
WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can update their own judicial_processes" 
ON public.judicial_processes 
FOR UPDATE 
USING (auth.uid() = userId);

CREATE POLICY "Users can delete their own judicial_processes" 
ON public.judicial_processes 
FOR DELETE 
USING (auth.uid() = userId);