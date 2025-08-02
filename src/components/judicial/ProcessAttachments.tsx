import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  Upload,
  File,
  Image,
  FileSpreadsheet,
  FileArchive,
  Calendar
} from 'lucide-react';

interface ProcessAttachment {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  url: string;
  description?: string;
  comment?: string;
}

interface ProcessAttachmentsProps {
  processId: string;
  clientId: string;
}

export const ProcessAttachments = ({ processId, clientId }: ProcessAttachmentsProps) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<ProcessAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Carregar anexos do processo
  const loadAttachments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('clientId', clientId)
        .eq('caseId', processId)
        .order('uploadDate', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      toast.error('Erro ao carregar anexos do processo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [processId, clientId]);

  // Upload de arquivo
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setIsUploading(true);
    try {
      // Upload do arquivo para o storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `process-attachments/${processId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('petition-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('petition-files')
        .getPublicUrl(filePath);

      // Salvar no banco de dados
      const { error: dbError } = await supabase
        .from('attachments')
        .insert({
          userId: user?.id || '',
          clientId: clientId,
          caseId: processId,
          title: title.trim(),
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          url: publicUrl,
          description: description.trim() || null,
          comment: comment.trim() || null,
        });

      if (dbError) throw dbError;

      toast.success('Arquivo anexado com sucesso!');
      setShowUploadDialog(false);
      resetForm();
      loadAttachments();

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao anexar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  // Deletar anexo
  const handleDelete = async (attachment: ProcessAttachment) => {
    try {
      // Deletar arquivo do storage
      const filePath = attachment.url.split('/').slice(-2).join('/');
      await supabase.storage
        .from('petition-files')
        .remove([filePath]);

      // Deletar do banco
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;

      toast.success('Anexo removido com sucesso!');
      loadAttachments();

    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
      toast.error('Erro ao remover anexo');
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setComment('');
    setFile(null);
  };

  // Get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <FileArchive className="h-4 w-4" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Anexos do Processo</h3>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Anexar Arquivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Anexar Arquivo ao Processo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Petição inicial, Documentos pessoais, etc."
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição detalhada do arquivo..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="comment">Comentário</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comentários adicionais..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isUploading} className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Enviando...' : 'Anexar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowUploadDialog(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando anexos...</p>
        </div>
      ) : attachments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum anexo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Este processo ainda não possui arquivos anexados.
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Anexar Primeiro Arquivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {attachments.map((attachment) => (
            <Card key={attachment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      {getFileIcon(attachment.fileType)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{attachment.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{attachment.fileName}</span>
                        <Badge variant="outline">{formatFileSize(attachment.fileSize)}</Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(attachment.uploadDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(attachment)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {(attachment.description || attachment.comment) && (
                <CardContent className="pt-0">
                  {attachment.description && (
                    <div className="mb-2">
                      <p className="text-sm font-medium mb-1">Descrição:</p>
                      <p className="text-sm text-muted-foreground">{attachment.description}</p>
                    </div>
                  )}
                  
                  {attachment.comment && (
                    <div>
                      <p className="text-sm font-medium mb-1">Comentário:</p>
                      <p className="text-sm text-muted-foreground">{attachment.comment}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessAttachments;