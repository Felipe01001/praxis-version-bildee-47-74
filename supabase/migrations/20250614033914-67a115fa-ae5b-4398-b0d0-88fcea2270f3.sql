
-- Criar bucket para armazenar os arquivos de petições
INSERT INTO storage.buckets (id, name, public) 
VALUES ('petition-files', 'petition-files', false);

-- Criar políticas para o bucket petition-files
CREATE POLICY "Users can upload petition files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'petition-files');

CREATE POLICY "Users can view petition files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'petition-files');

CREATE POLICY "Users can update petition files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'petition-files');

CREATE POLICY "Users can delete petition files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'petition-files');

-- Atualizar a tabela petition_template_files para incluir storage_path
ALTER TABLE petition_template_files 
ADD COLUMN storage_path TEXT;

-- Adicionar índice para melhor performance
CREATE INDEX idx_petition_template_files_storage_path 
ON petition_template_files(storage_path);
