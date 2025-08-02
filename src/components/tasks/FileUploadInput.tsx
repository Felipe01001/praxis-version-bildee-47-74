
import { useState } from 'react';
import { TaskAttachment } from '@/types';
import { Upload, X, Paperclip, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FileUploadInputProps {
  onAddAttachment?: (attachment: TaskAttachment) => void;
  // Compatibility prop for TasksTab.tsx
  onFileUpload?: (attachment: TaskAttachment) => void;
}

export const FileUploadInput = ({ onAddAttachment, onFileUpload }: FileUploadInputProps) => {
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'document' | 'link'>('link');
  const [isUploading, setIsUploading] = useState(false);
  
  const handleAddAttachment = () => {
    if (!attachmentName || !attachmentUrl) {
      toast.error('Preencha o nome e o URL do anexo');
      return;
    }
    
    const newAttachment: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: attachmentName,
      url: attachmentUrl,
      type: attachmentType,
      uploadDate: new Date().toISOString()
    };
    
    // Support both prop names
    if (onFileUpload) {
      onFileUpload(newAttachment);
    } else if (onAddAttachment) {
      onAddAttachment(newAttachment);
    }
    
    setAttachmentName('');
    setAttachmentUrl('');
    setAttachmentType('link');
    
    toast.success('Anexo adicionado');
  };
  
  // Simulates a file upload - in a real app, this would upload to storage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Get file type
    let fileType: 'image' | 'document' | 'link' = 'document';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    }
    
    // In a real application, you'd upload the file to a storage service
    // For now we'll create a fake URL and simulate upload
    setTimeout(() => {
      const fakeUrl = URL.createObjectURL(file);
      
      const newAttachment: TaskAttachment = {
        id: `file-${Date.now()}`,
        name: file.name,
        url: fakeUrl,
        type: fileType,
        size: file.size,
        uploadDate: new Date().toISOString()
      };
      
      // Support both prop names
      if (onFileUpload) {
        onFileUpload(newAttachment);
      } else if (onAddAttachment) {
        onAddAttachment(newAttachment);
      }
      
      setIsUploading(false);
      toast.success('Arquivo carregado com sucesso');
      
      // Reset the input
      e.target.value = '';
    }, 1500);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-1/3">
          <label className="text-xs font-medium block mb-1">Arquivo</label>
          <div className="relative">
            <Input
              type="file"
              className="sr-only"
              id="file-upload"
              onChange={handleFileUpload}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={isUploading}
              asChild
            >
              <label htmlFor="file-upload">
                <Upload className="h-4 w-4" />
                {isUploading ? 'Carregando...' : 'Carregar arquivo'}
              </label>
            </Button>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1">Nome</label>
            <Input 
              placeholder="Nome do anexo"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">URL</label>
            <div className="flex gap-2">
              <Input 
                placeholder="URL do anexo"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
              />
              <Button type="button" size="icon" onClick={handleAddAttachment}>
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Você pode carregar um arquivo do seu computador ou adicionar um link externo.
      </div>
    </div>
  );
};
