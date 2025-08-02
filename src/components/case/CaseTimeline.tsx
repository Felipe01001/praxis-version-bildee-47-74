
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  FileText, 
  Paperclip,
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Image,
  Pencil,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CaseTimelineItem, Task, Attachment, TimelineItemType } from '@/types';
import { toast } from 'sonner';

interface CaseTimelineProps {
  caseId: string;
  timelineItems: CaseTimelineItem[];
  onAddItem: (item: Omit<CaseTimelineItem, 'id'>) => void;
  tasks?: Task[];
  attachments?: Attachment[];
}

export const CaseTimeline = ({
  caseId,
  timelineItems = [],
  onAddItem,
  tasks = [],
  attachments = []
}: CaseTimelineProps) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [newItemType, setNewItemType] = useState<TimelineItemType | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemFile, setNewItemFile] = useState<File | null>(null);

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleAddItem = (type: TimelineItemType) => {
    setNewItemType(type);
    setNewItemTitle('');
    setNewItemContent('');
    setNewItemFile(null);
  };
  
  const handleSubmitItem = () => {
    if (!newItemType) return;
    
    if ((newItemType === 'image' || newItemType === 'attachment') && !newItemFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }
    
    if (newItemType === 'update' || newItemType === 'note') {
      if (!newItemContent.trim()) {
        toast.error('Por favor, escreva algum conteúdo');
        return;
      }
    }
    
    // In a real app, you would upload the file and get a URL
    // For this example, we'll just simulate it
    const newItem = {
      caseId,
      type: newItemType,
      title: newItemTitle || `Novo ${getItemTypeName(newItemType)}`,
      content: newItemContent,
      description: newItemContent, // Added to satisfy the type
      attachmentUrl: newItemType === 'attachment' ? 'simulated-url' : undefined,
      imageUrl: newItemType === 'image' ? 'simulated-url' : undefined,
      date: new Date().toISOString(),
    };
    
    onAddItem(newItem);
    toast.success(`${getItemTypeName(newItemType)} adicionado com sucesso`);
    setNewItemType(null);
  };
  
  const getItemTypeName = (type: TimelineItemType): string => {
    switch(type) {
      case 'image': return 'Imagem';
      case 'attachment': return 'Anexo';
      case 'update': return 'Atualização';
      case 'note': return 'Observação';
      case 'document': return 'Documento';
      case 'hearing': return 'Audiência';
      case 'deadline': return 'Prazo';
    }
  };
  
  const getItemIcon = (type: TimelineItemType) => {
    switch(type) {
      case 'image': return <Image className="h-5 w-5 text-blue-500" />;
      case 'attachment': return <Paperclip className="h-5 w-5 text-amber-500" />;
      case 'update': return <Pencil className="h-5 w-5 text-purple-500" />;
      case 'note': return <FileText className="h-5 w-5 text-green-500" />;
      case 'document': return <FileText className="h-5 w-5 text-green-500" />;
      case 'hearing': return <User className="h-5 w-5 text-blue-500" />;
      case 'deadline': return <Clock className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const formatDateTime = (dateTimeString: string) => {
    const dateTime = new Date(dateTimeString);
    return {
      date: dateTime.toLocaleDateString('pt-BR'),
      time: dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const sortedItems = [...timelineItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Linha do Tempo</CardTitle>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleAddItem('image')} className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                Imagem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input 
                  type="text" 
                  placeholder="Título (opcional)" 
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                />
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setNewItemFile(e.target.files?.[0] || null)}
                />
                <Textarea
                  placeholder="Descrição da imagem (opcional)"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewItemType(null)}>Cancelar</Button>
                  <Button onClick={handleSubmitItem}>Adicionar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleAddItem('attachment')} className="flex items-center gap-1">
                <Paperclip className="h-4 w-4" />
                Anexo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Anexo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input 
                  type="text" 
                  placeholder="Título do anexo" 
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                />
                <Input 
                  type="file" 
                  onChange={(e) => setNewItemFile(e.target.files?.[0] || null)}
                />
                <Textarea
                  placeholder="Descrição do anexo (opcional)"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewItemType(null)}>Cancelar</Button>
                  <Button onClick={handleSubmitItem}>Adicionar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleAddItem('update')} className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                Atualização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Atualização</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input 
                  type="text" 
                  placeholder="Título da atualização" 
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Detalhes da atualização"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  className="min-h-[150px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewItemType(null)}>Cancelar</Button>
                  <Button onClick={handleSubmitItem}>Adicionar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => handleAddItem('note')} className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Observação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Observação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input 
                  type="text" 
                  placeholder="Título da observação" 
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Conteúdo da observação"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  className="min-h-[150px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewItemType(null)}>Cancelar</Button>
                  <Button onClick={handleSubmitItem}>Adicionar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {sortedItems.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-muted space-y-6">
            {sortedItems.map((item) => {
              const { date, time } = formatDateTime(item.date);
              const isExpanded = expandedItems[item.id] || false;
              
              return (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[23px] mt-1 p-1 rounded-full bg-white border-2 border-muted">
                    {getItemIcon(item.type)}
                  </div>
                  
                  <div 
                    className="mb-4 cursor-pointer hover:bg-muted/30 p-3 rounded-lg transition-colors"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{item.title}</h3>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        {!isExpanded && (item.content || item.description) && (
                          <p className="text-muted-foreground line-clamp-1">{item.content || item.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{date}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{time}</span>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 pl-4 border-l-2 border-dotted border-muted">
                        {(item.content || item.description) && (
                          <div className="mb-4">
                            <p className="whitespace-pre-wrap">{item.content || item.description}</p>
                          </div>
                        )}
                        
                        {item.type === 'image' && item.imageUrl && (
                          <div className="mt-2">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title || "Imagem do atendimento"} 
                              className="max-w-full max-h-[300px] rounded-md object-cover"
                            />
                          </div>
                        )}
                        
                        {item.type === 'attachment' && item.attachmentUrl && (
                          <div className="mt-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <Paperclip className="mr-2 h-4 w-4" />
                                Baixar Anexo
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Esta linha do tempo está vazia.</p>
            <p className="text-sm mt-2">Adicione itens usando os botões acima.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <div className="flex items-center justify-center gap-1">
            <Plus className="h-4 w-4" />
            Ver Todas as Atualizações
          </div>
        </Button>
      </CardFooter>
    </Card>
  );
};
