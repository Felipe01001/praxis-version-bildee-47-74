-- Verificar e garantir consistência em camelCase para todas as colunas relacionadas a cliente

-- Se existir alguma coluna snake_case, vamos renomear para camelCase
-- Verificar se existem colunas com nomes inconsistentes e corrigi-las

-- Para a tabela clients - garantir que todas as colunas estejam em camelCase
-- (As colunas já parecem estar corretas, mas vamos verificar)

-- Para casos onde pode haver inconsistência, vamos garantir que está tudo em camelCase
-- Não vamos fazer mudanças desnecessárias se já estiver correto

-- Verificar se existe alguma view ou função que possa estar usando snake_case
-- e atualizar as políticas RLS se necessário

-- Recriar as políticas RLS para garantir que estão usando os nomes corretos das colunas
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
DROP POLICY IF EXISTS "Users can create their own cases" ON cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON cases;

DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can create their own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can update their own attachments" ON attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON attachments;

DROP POLICY IF EXISTS "Users can view their own petitions" ON petitions;
DROP POLICY IF EXISTS "Users can create their own petitions" ON petitions;
DROP POLICY IF EXISTS "Users can update their own petitions" ON petitions;
DROP POLICY IF EXISTS "Users can delete their own petitions" ON petitions;

DROP POLICY IF EXISTS "Users can view their own judicial_processes" ON judicial_processes;
DROP POLICY IF EXISTS "Users can create their own judicial_processes" ON judicial_processes;
DROP POLICY IF EXISTS "Users can update their own judicial_processes" ON judicial_processes;
DROP POLICY IF EXISTS "Users can delete their own judicial_processes" ON judicial_processes;

-- Recriar todas as políticas RLS usando explicitamente camelCase
-- CLIENTS
CREATE POLICY "Users can view their own clients" ON clients FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can create their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = "userId");

-- CASES
CREATE POLICY "Users can view their own cases" ON cases FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can create their own cases" ON cases FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own cases" ON cases FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own cases" ON cases FOR DELETE USING (auth.uid() = "userId");

-- TASKS
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can create their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = "userId");

-- ATTACHMENTS
CREATE POLICY "Users can view their own attachments" ON attachments FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can create their own attachments" ON attachments FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own attachments" ON attachments FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own attachments" ON attachments FOR DELETE USING (auth.uid() = "userId");

-- PETITIONS
CREATE POLICY "Users can view their own petitions" ON petitions FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can create their own petitions" ON petitions FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own petitions" ON petitions FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own petitions" ON petitions FOR DELETE USING (auth.uid() = "userId");

-- JUDICIAL_PROCESSES
CREATE POLICY "Users can view their own judicial_processes" ON judicial_processes FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can create their own judicial_processes" ON judicial_processes FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own judicial_processes" ON judicial_processes FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete their own judicial_processes" ON judicial_processes FOR DELETE USING (auth.uid() = "userId");