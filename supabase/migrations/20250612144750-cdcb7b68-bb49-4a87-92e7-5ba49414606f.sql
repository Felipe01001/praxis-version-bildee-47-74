
-- Criar tabela para modelos de petições
CREATE TABLE public.petition_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tema TEXT NOT NULL,
  subtema TEXT NOT NULL,
  titulo TEXT NOT NULL,
  ordem TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para arquivos dos modelos
CREATE TABLE public.petition_template_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.petition_templates(id) ON DELETE CASCADE,
  arquivo_nome TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('docx', 'pdf')),
  file_size BIGINT,
  content_text TEXT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar bucket para armazenar os arquivos
INSERT INTO storage.buckets (id, name, public) VALUES ('petition-templates', 'petition-templates', true);

-- Criar políticas RLS para petition_templates
ALTER TABLE public.petition_templates ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos podem ver os modelos)
CREATE POLICY "Anyone can view petition templates" 
  ON public.petition_templates 
  FOR SELECT 
  USING (true);

-- Política para inserção (apenas usuários autenticados)
CREATE POLICY "Authenticated users can create petition templates" 
  ON public.petition_templates 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização (apenas usuários autenticados)
CREATE POLICY "Authenticated users can update petition templates" 
  ON public.petition_templates 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Política para exclusão (apenas usuários autenticados)
CREATE POLICY "Authenticated users can delete petition templates" 
  ON public.petition_templates 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Criar políticas RLS para petition_template_files
ALTER TABLE public.petition_template_files ENABLE ROW LEVEL SECURITY;

-- Política para leitura (todos podem ver os arquivos)
CREATE POLICY "Anyone can view petition template files" 
  ON public.petition_template_files 
  FOR SELECT 
  USING (true);

-- Política para inserção (apenas usuários autenticados)
CREATE POLICY "Authenticated users can create petition template files" 
  ON public.petition_template_files 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Política para atualização (apenas usuários autenticados)
CREATE POLICY "Authenticated users can update petition template files" 
  ON public.petition_template_files 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Política para exclusão (apenas usuários autenticados)
CREATE POLICY "Authenticated users can delete petition template files" 
  ON public.petition_template_files 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Criar políticas para o bucket de storage
CREATE POLICY "Anyone can view petition template files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'petition-templates');

CREATE POLICY "Authenticated users can upload petition template files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'petition-templates' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update petition template files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'petition-templates' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete petition template files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'petition-templates' AND auth.role() = 'authenticated');

-- Criar índices para melhorar performance de busca
CREATE INDEX idx_petition_templates_tema ON public.petition_templates(tema);
CREATE INDEX idx_petition_templates_subtema ON public.petition_templates(subtema);
CREATE INDEX idx_petition_templates_ordem ON public.petition_templates(ordem);
CREATE INDEX idx_petition_template_files_template_id ON public.petition_template_files(template_id);
CREATE INDEX idx_petition_template_files_tipo ON public.petition_template_files(tipo);

-- Criar índice de texto completo para busca no conteúdo
CREATE INDEX idx_petition_template_files_content_text ON public.petition_template_files USING gin(to_tsvector('portuguese', content_text));
