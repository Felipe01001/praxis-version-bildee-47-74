
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PetitionTemplateWithFiles } from '@/types/petition-template';
import { Client } from '@/types';

interface LawyerData {
  name: string;
  email: string;
  phone: string;
  oabNumber: string;
  state: string;
  city: string;
}

export const usePetitionGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePetition = async (
    template: PetitionTemplateWithFiles,
    clientData: Client,
    lawyerData?: LawyerData,
    userDescription?: string
  ): Promise<string | null> => {
    try {
      setIsGenerating(true);
      console.log('=== HOOK: INICIANDO GERAÇÃO DE PETIÇÃO ===');
      console.log('Template:', template.titulo);
      console.log('Cliente:', clientData.name);
      console.log('Advogado:', lawyerData?.name);
      console.log('Descrição do usuário:', userDescription || 'Não fornecida');

      // Verificar se temos conteúdo extraído dos arquivos
      let templateContent = '';
      
      if (template.files.length > 0) {
        console.log('Buscando conteúdo extraído dos arquivos...');
        const fileWithContent = template.files.find(f => f.content_text && f.content_text.trim() !== '');
        if (fileWithContent?.content_text) {
          templateContent = fileWithContent.content_text;
          console.log('Conteúdo encontrado no arquivo:', fileWithContent.arquivo_nome);
        } else {
          console.log('Nenhum arquivo com conteúdo extraído encontrado');
        }
      }

      // Se não tem conteúdo extraído, usar template padrão
      if (!templateContent) {
        console.log('Usando template padrão gerado');
        templateContent = generateDefaultTemplate(template);
      }

      // Validar dados do cliente
      if (!clientData.name || !clientData.email) {
        throw new Error('Dados do cliente incompletos (nome e email são obrigatórios)');
      }

      console.log('Dados do cliente validados:', {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        cpf: clientData.cpf
      });

      if (lawyerData) {
        console.log('Dados do advogado:', {
          name: lawyerData.name,
          email: lawyerData.email,
          oabNumber: lawyerData.oabNumber,
          city: lawyerData.city,
          state: lawyerData.state
        });
      }

      toast.loading('Gerando petição com inteligência artificial...', { 
        duration: 20000,
        description: `Template: ${template.titulo}`
      });

      console.log('Chamando edge function generate-petition...');

      const requestPayload = {
        templateContent,
        clientData: {
          ...clientData,
          nationality: clientData.nationality || 'Brasileiro(a)',
          maritalStatus: clientData.maritalStatus || 'Não informado',
          profession: clientData.profession || 'Não informado'
        },
        lawyerData,
        tema: template.tema,
        subtema: template.subtema,
        titulo: template.titulo,
        userDescription: userDescription || ''
      };

      console.log('Payload para edge function:', {
        ...requestPayload,
        templateContent: requestPayload.templateContent.substring(0, 200) + '...'
      });

      const { data, error } = await supabase.functions.invoke('generate-petition', {
        body: requestPayload
      });

      console.log('Resposta da edge function:', { data, error });

      if (error) {
        console.error('Erro na edge function:', error);
        throw new Error(error.message || 'Erro ao chamar serviço de geração');
      }

      if (!data) {
        throw new Error('Resposta vazia do serviço de geração');
      }

      if (!data.success) {
        console.error('Edge function retornou sucesso = false:', data);
        throw new Error(data.error || 'Erro desconhecido na geração');
      }

      if (!data.generatedPetition) {
        throw new Error('Conteúdo da petição não foi gerado');
      }

      console.log('Petição gerada com sucesso!');
      console.log('Tamanho da petição gerada:', data.generatedPetition.length);
      
      toast.dismiss();
      toast.success('Petição gerada com sucesso!', {
        description: `Template: ${template.titulo} | Cliente: ${clientData.name}`
      });
      
      return data.generatedPetition;
    } catch (err) {
      console.error('=== HOOK: ERRO NA GERAÇÃO ===');
      console.error('Erro completo:', err);
      console.error('Stack trace:', err instanceof Error ? err.stack : 'N/A');
      
      toast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      
      if (errorMessage.includes('Insufficient Balance')) {
        toast.error('Crédito insuficiente na API DeepSeek', {
          description: 'Verifique se há crédito disponível na sua conta DeepSeek.'
        });
      } else if (errorMessage.includes('DeepSeek')) {
        toast.error('Erro na API DeepSeek', {
          description: errorMessage
        });
      } else {
        toast.error(`Erro ao gerar petição: ${errorMessage}`, {
          description: 'Verifique os logs do console para mais detalhes.'
        });
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDefaultTemplate = (template: PetitionTemplateWithFiles): string => {
    return `PETIÇÃO INICIAL - ${template.titulo}

Modelo base para geração de petição na área de ${template.tema} - ${template.subtema}.

Este conteúdo será usado como referência para a geração da petição completa pela IA.`;
  };

  return {
    generatePetition,
    isGenerating
  };
};
