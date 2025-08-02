
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PetitionPreview } from './PetitionPreview';
import { RichTextEditor } from './RichTextEditor';
import { PetitionTemplateWithFiles } from '@/types/petition-template';
import { usePetitionTemplates } from '@/hooks/usePetitionTemplates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Edit } from 'lucide-react';

interface TemplateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: PetitionTemplateWithFiles | null;
}

export const TemplateViewerModal = ({ isOpen, onClose, template }: TemplateViewerModalProps) => {
  const { getTemplateContent } = usePetitionTemplates();
  const [content, setContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      if (template && isOpen) {
        setLoading(true);
        try {
          const templateContent = await getTemplateContent(template);
          setContent(templateContent);
          setEditedContent(templateContent);
        } catch (error) {
          console.error('Error loading template content:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadContent();
  }, [template, isOpen, getTemplateContent]);

  const handleSave = () => {
    setContent(editedContent);
    // Aqui você pode adicionar lógica para salvar o conteúdo editado no banco
    onClose();
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {template.titulo}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="flex-1">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Carregando conteúdo...</p>
                </div>
              ) : (
                <PetitionPreview content={content} />
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="edit" className="flex-1 flex flex-col">
            <div className="flex-1">
              <RichTextEditor
                value={editedContent}
                onChange={setEditedContent}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar Alterações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
