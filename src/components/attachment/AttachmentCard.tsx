
import { Attachment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface AttachmentCardProps {
  attachment: Attachment;
  onDelete: (id: string) => void;
}

export const AttachmentCard = ({ attachment, onDelete }: AttachmentCardProps) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getFileIcon(attachment.fileType)}
            <div>
              <h4 className="font-medium">{attachment.title}</h4>
              <p className="text-sm text-muted-foreground">{attachment.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.fileSize || 0)} • {format(new Date(attachment.uploadDate), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(attachment.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {attachment.description && (
          <p className="text-sm text-muted-foreground mt-2">{attachment.description}</p>
        )}
      </CardContent>
    </Card>
  );
};
