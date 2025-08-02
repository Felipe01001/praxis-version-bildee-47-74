
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Attachment } from '@/types';

interface AttachmentFormProps {
  clientId: string;
  onSubmit: (attachment: Omit<Attachment, 'id' | 'uploadDate'>) => void;
  onCancel: () => void;
}

export const AttachmentForm = ({ clientId, onSubmit, onCancel }: AttachmentFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    // In a real implementation, you would upload the file to a storage service
    // For now, we'll create a mock URL
    const mockUrl = URL.createObjectURL(file);

    onSubmit({
      clientId,
      title,
      description,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      url: mockUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="file">Arquivo</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};
