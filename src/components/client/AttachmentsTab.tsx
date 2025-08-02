import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AttachmentCard } from '@/components/attachment/AttachmentCard';
import { AttachmentForm } from '@/components/forms/AttachmentForm';
import { Attachment } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
interface AttachmentsTabProps {
  attachments: Attachment[];
  clientId: string;
  addAttachment: (attachment: Omit<Attachment, 'id' | 'uploadDate'>) => Promise<Attachment>;
  deleteAttachment: (id: string) => Promise<void>;
}
export const AttachmentsTab = ({
  attachments,
  clientId,
  addAttachment,
  deleteAttachment
}: AttachmentsTabProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const handleAddAttachment = async (attachmentData: Omit<Attachment, 'id' | 'uploadDate'>) => {
    await addAttachment(attachmentData);
    setIsFormOpen(false);
  };
  const handleDeleteAttachment = async (id: string) => {
    await deleteAttachment(id);
  };
  return <div className="space-y-6 my-0 mx-0 px-0 py-[51px]">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Anexos</h3>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Anexo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Anexo</DialogTitle>
            </DialogHeader>
            <AttachmentForm clientId={clientId} onSubmit={handleAddAttachment} onCancel={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {attachments.length > 0 ? <div className="grid gap-4">
          {attachments.map(attachment => <AttachmentCard key={attachment.id} attachment={attachment} onDelete={handleDeleteAttachment} />)}
        </div> : <Card>
          <CardContent className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum anexo encontrado para este cliente.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Anexo
            </Button>
          </CardContent>
        </Card>}
    </div>;
};