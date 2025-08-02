import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PetitionTemplateWithFiles } from '@/types/petition-template';
import { toast } from 'sonner';

export const usePetitionTemplates = () => {
  const [templates, setTemplates] = useState<PetitionTemplateWithFiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching petition templates...');

      // Buscar templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('petition_templates')
        .select('*')
        .order('ordem');

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        throw templatesError;
      }

      console.log('Templates fetched:', templatesData?.length || 0);

      // Buscar arquivos para cada template
      const { data: filesData, error: filesError } = await supabase
        .from('petition_template_files')
        .select('*')
        .order('upload_date');

      if (filesError) {
        console.error('Error fetching files:', filesError);
        throw filesError;
      }

      console.log('Files fetched:', filesData?.length || 0);

      // Combinar templates com seus arquivos
      const templatesWithFiles = (templatesData || []).map(template => ({
        ...template,
        files: (filesData || []).filter(file => file.template_id === template.id).map(file => ({
          ...file,
          tipo: file.tipo as 'docx' | 'pdf'
        }))
      }));

      console.log('Templates with files combined:', templatesWithFiles.length);
      setTemplates(templatesWithFiles);
    } catch (err) {
      console.error('Erro ao buscar modelos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  };

  const searchTemplates = async (searchTerm: string = '', tema: string = '', subtema: string = '') => {
    try {
      setLoading(true);
      setError(null);
      console.log('Searching templates with:', { searchTerm, tema, subtema });

      let query = supabase.from('petition_templates').select('*');

      // Aplicar filtros se fornecidos
      if (tema && tema !== '') {
        query = query.eq('tema', tema);
      }

      if (subtema && subtema !== '') {
        query = query.eq('subtema', subtema);
      }

      if (searchTerm && searchTerm !== '') {
        query = query.or(`titulo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
      }

      const { data: templatesData, error: templatesError } = await query.order('ordem');

      if (templatesError) {
        console.error('Error searching templates:', templatesError);
        throw templatesError;
      }

      // Buscar arquivos para os templates encontrados
      const { data: filesData, error: filesError } = await supabase
        .from('petition_template_files')
        .select('*')
        .order('upload_date');

      if (filesError) {
        console.error('Error fetching files:', filesError);
        throw filesError;
      }

      // Combinar templates com seus arquivos
      const templatesWithFiles = (templatesData || []).map(template => ({
        ...template,
        files: (filesData || []).filter(file => file.template_id === template.id).map(file => ({
          ...file,
          tipo: file.tipo as 'docx' | 'pdf'
        }))
      }));

      console.log('Search results:', templatesWithFiles.length);
      setTemplates(templatesWithFiles);
    } catch (err) {
      console.error('Erro ao buscar modelos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao buscar modelos');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: {
    tema: string;
    subtema: string;
    titulo: string;
    ordem: string;
    descricao?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('petition_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      await fetchTemplates();
      
      return data;
    } catch (err) {
      console.error('Erro ao criar modelo:', err);
      throw err;
    }
  };

  const uploadFile = async (file: File, templateId: string) => {
    try {
      console.log('Starting file upload for template:', templateId);
      toast.loading(`Processando arquivo ${file.name}...`);
      
      // Verificar se o template existe
      const { data: templateExists } = await supabase
        .from('petition_templates')
        .select('id')
        .eq('id', templateId)
        .single();

      if (!templateExists) {
        throw new Error('Template não encontrado');
      }

      // Criar nome único para o arquivo
      const fileExtension = file.name.split('.').pop();
      const fileName = `${templateId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      
      // Upload real para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('petition-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded to storage:', uploadData.path);
      toast.loading('Extraindo conteúdo do arquivo...');

      // Chamar Edge Function para extrair texto
      let extractedText = '';
      try {
        const { data: extractResult, error: extractError } = await supabase.functions
          .invoke('extract-text', {
            body: {
              filePath: uploadData.path,
              fileType: fileExtension === 'pdf' ? 'pdf' : 'docx'
            }
          });

        if (extractResult?.extractedText) {
          extractedText = extractResult.extractedText;
          console.log('Text extraction successful, length:', extractedText.length);
        } else {
          console.warn('No extracted text returned');
          extractedText = `Conteúdo do arquivo ${file.name} carregado. Use a aba "Editar" para visualizar e modificar.`;
        }
      } catch (extractError) {
        console.warn('Text extraction failed:', extractError);
        extractedText = `Arquivo ${file.name} carregado com sucesso. Use a aba "Editar" para adicionar o conteúdo.`;
      }

      // Salvar informações do arquivo no banco
      const fileData = {
        template_id: templateId,
        arquivo_nome: file.name,
        arquivo_url: `https://pocynpbouhtlkhcryopn.supabase.co/storage/v1/object/public/petition-files/${uploadData.path}`,
        storage_path: uploadData.path,
        tipo: fileExtension === 'pdf' ? 'pdf' : 'docx',
        file_size: file.size,
        content_text: extractedText
      };

      const { data, error } = await supabase
        .from('petition_template_files')
        .insert([fileData])
        .select()
        .single();

      if (error) throw error;

      console.log('File record saved to database:', data);
      toast.dismiss();
      toast.success(`Arquivo ${file.name} processado com sucesso!`);
      
      // Atualizar lista local
      await fetchTemplates();
      
      return data;
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      toast.dismiss();
      toast.error(`Erro ao processar arquivo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      throw err;
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      console.log('Downloading file:', fileName, 'from:', fileUrl);
      
      // Fazer download real do arquivo
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erro ao baixar arquivo');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Arquivo baixado com sucesso');
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
      toast.error('Erro ao baixar arquivo');
      throw err;
    }
  };

  const getTemplateContent = async (template: PetitionTemplateWithFiles): Promise<string> => {
    console.log('Getting template content for:', template.titulo);
    
    // Primeiro, tentar usar o conteúdo extraído dos arquivos
    if (template.files.length > 0) {
      const fileWithContent = template.files.find(f => f.content_text && f.content_text.trim() !== '');
      if (fileWithContent?.content_text) {
        console.log('Using extracted content from file:', fileWithContent.arquivo_nome);
        return fileWithContent.content_text;
      }
    }

    // Se não tem conteúdo extraído, retorna conteúdo padrão
    console.log('No extracted content found, using default template');
    return generateDefaultTemplateContent(template);
  };

  const generateDefaultTemplateContent = (template: PetitionTemplateWithFiles): string => {
    return `# ${template.titulo}

## Informações do Template
**Tema:** ${template.tema}
**Subtema:** ${template.subtema}
**Ordem:** ${template.ordem}

${template.descricao ? `**Descrição:** ${template.descricao}` : ''}

## Estrutura da Petição

### EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO

Ao Excelentíssimo Senhor Doutor Juiz de Direito da ___ª Vara Cível da Comarca de ___

### QUALIFICAÇÃO DAS PARTES

**REQUERENTE:** [Nome completo], [nacionalidade], [estado civil], [profissão], portador do RG nº [número], inscrito no CPF sob o nº [número], residente e domiciliado à [endereço completo].

**REQUERIDO:** [Nome/Razão Social], [qualificação completa], [endereço].

### DOS FATOS

[Descrição detalhada dos fatos relacionados ao tema: ${template.tema}]

### DO DIREITO

[Fundamentação jurídica aplicável ao caso de ${template.subtema}]

### DOS PEDIDOS

Diante do exposto, requer-se:

a) [Pedido principal relacionado a ${template.tema}];
b) [Pedidos subsidiários, se houver];
c) A condenação do requerido ao pagamento das custas processuais e honorários advocatícios.

### VALOR DA CAUSA

Atribui-se à presente causa o valor de R$ ___,__.

**Termos em que pede deferimento.**

[Local], [data].

____________________
[Nome do Advogado]
OAB/[UF] nº [número]`;
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      console.log('Deleting template:', templateId);
      
      // Primeiro, buscar e deletar arquivos do storage
      const { data: files } = await supabase
        .from('petition_template_files')
        .select('storage_path')
        .eq('template_id', templateId);

      if (files && files.length > 0) {
        for (const file of files) {
          if (file.storage_path) {
            await supabase.storage
              .from('petition-files')
              .remove([file.storage_path]);
          }
        }
      }

      // Deletar registros dos arquivos do banco
      const { error: filesError } = await supabase
        .from('petition_template_files')
        .delete()
        .eq('template_id', templateId);

      if (filesError) {
        console.error('Error deleting template files:', filesError);
        throw filesError;
      }

      // Deletar o template
      const { error: templateError } = await supabase
        .from('petition_templates')
        .delete()
        .eq('id', templateId);

      if (templateError) {
        console.error('Error deleting template:', templateError);
        throw templateError;
      }

      console.log('Template deleted successfully');
      toast.success('Modelo deletado com sucesso');
      
      // Atualizar lista local
      await fetchTemplates();
    } catch (err) {
      console.error('Erro ao deletar modelo:', err);
      toast.error('Erro ao deletar modelo');
      throw err;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      console.log('Deleting file:', fileId);
      
      // Buscar o arquivo para obter o storage_path
      const { data: fileData } = await supabase
        .from('petition_template_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      // Deletar do storage se existe storage_path
      if (fileData?.storage_path) {
        await supabase.storage
          .from('petition-files')
          .remove([fileData.storage_path]);
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from('petition_template_files')
        .delete()
        .eq('id', fileId);

      if (error) {
        console.error('Error deleting file:', error);
        throw error;
      }

      console.log('File deleted successfully');
      toast.success('Arquivo deletado com sucesso');
      
      // Atualizar lista local
      await fetchTemplates();
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err);
      toast.error('Erro ao deletar arquivo');
      throw err;
    }
  };

  useEffect(() => {
    console.log('usePetitionTemplates hook mounted, fetching templates...');
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    searchTemplates,
    createTemplate,
    uploadFile,
    downloadFile,
    getTemplateContent,
    deleteTemplate,
    deleteFile
  };
};
