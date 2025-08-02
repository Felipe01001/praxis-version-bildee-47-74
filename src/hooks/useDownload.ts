
import { useState } from 'react';
import { toast } from 'sonner';
import { downloadAsPDF, downloadAsDOCX, downloadAsJSON, PetitionData } from '@/utils/downloadUtils';

export const useDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (
    format: 'pdf' | 'docx' | 'json',
    petitionData: PetitionData
  ) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      toast.loading(`Preparando download em ${format.toUpperCase()}...`, {
        duration: 10000
      });

      switch (format) {
        case 'pdf':
          await downloadAsPDF(petitionData);
          break;
        case 'docx':
          await downloadAsDOCX(petitionData);
          break;
        case 'json':
          downloadAsJSON(petitionData);
          break;
        default:
          throw new Error('Formato não suportado');
      }

      toast.dismiss();
      toast.success(`Download em ${format.toUpperCase()} concluído!`, {
        description: `Arquivo salvo: ${petitionData.title}`
      });
    } catch (error) {
      console.error('Erro no download:', error);
      toast.dismiss();
      toast.error(`Erro ao baixar em ${format.toUpperCase()}`, {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    handleDownload,
    isDownloading
  };
};
