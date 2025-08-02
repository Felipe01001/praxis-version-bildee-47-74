
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Pencil, Trash2, User, Save, Eye, Edit3, Copy, Share2, Printer, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { usePraxisContext } from '@/context/PraxisContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RichTextEditor } from '@/components/petition/RichTextEditor';
import { PetitionPreview } from '@/components/petition/PetitionPreview';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDownload } from '@/hooks/useDownload';
import { copyFormattedText } from '@/utils/downloadUtils';

const PetitionDetailPage = () => {
  const { petitionId } = useParams<{ petitionId: string; }>();
  const navigate = useNavigate();
  const { petitions, clients, updatePetition, deletePetition } = usePraxisContext();
  const { handleDownload, isDownloading } = useDownload();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedCategory, setEditedCategory] = useState('civil');
  const [editedClientId, setEditedClientId] = useState('');
  const [currentTab, setCurrentTab] = useState<'preview' | 'edit'>('preview');

  const petition = petitions.find(p => p.id === petitionId);
  const client = petition?.clientId ? clients.find(c => c.id === petition.clientId) : null;

  useEffect(() => {
    if (petition) {
      setEditedTitle(petition.title);
      setEditedContent(petition.content);
      setEditedCategory(petition.category);
      setEditedClientId(petition.clientId || '');
    }
  }, [petition]);

  if (!petition) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Petição não encontrada</h2>
        <p className="text-muted-foreground mb-6">A petição que você está procurando não existe ou foi removida.</p>
        <Button variant="outline" onClick={() => navigate('/petitions')}>
          Voltar para a lista de petições
        </Button>
      </div>
    );
  }

  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      'civil': 'Cível',
      'criminal': 'Criminal',
      'social-security': 'Previdenciário',
      'labor': 'Trabalhista',
      'administrative': 'Administrativo'
    };
    return categories[category] || category;
  };

  const handleSaveChanges = () => {
    if (!editedTitle) {
      toast.error('O título da petição é obrigatório.');
      return;
    }
    try {
      const updatedPetition = {
        ...petition,
        title: editedTitle,
        content: editedContent,
        category: editedCategory,
        clientId: editedClientId || undefined,
        updatedAt: new Date().toISOString()
      };
      updatePetition(updatedPetition);
      setIsEditing(false);
      setCurrentTab('preview');
      toast.success('Petição atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar petição:', error);
      toast.error('Erro ao atualizar a petição. Tente novamente.');
    }
  };

  const handleDeletePetition = () => {
    try {
      deletePetition(petitionId!);
      toast.success('Petição excluída com sucesso!');

      if (petition.clientId) {
        navigate(`/clients/${petition.clientId}?tab=petitions`);
      } else {
        navigate('/petitions');
      }
    } catch (error) {
      console.error('Erro ao excluir petição:', error);
      toast.error('Erro ao excluir a petição. Tente novamente.');
    }
  };

  const handleDownloadFormat = async (format: 'pdf' | 'docx' | 'json') => {
    if (!petition) return;
    const petitionData = {
      title: petition.title,
      content: petition.content,
      category: petition.category,
      clientName: client?.name,
      createdAt: petition.createdAt
    };
    await handleDownload(format, petitionData);
  };

  const handleEditMode = () => {
    setIsEditing(true);
    setCurrentTab('edit');
  };

  const handleShare = () => {
    toast.success('Link da petição copiado para a área de transferência!');
  };

  const handleCopy = () => {
    try {
      copyFormattedText(petition.content);
      toast.success('Conteúdo da petição copiado com formatação!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      navigator.clipboard.writeText(petition.content)
        .then(() => toast.success('Conteúdo da petição copiado!'))
        .catch(() => toast.error('Erro ao copiar conteúdo'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Header compacto */}
      <div className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/petitions')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getCategoryText(petition.category)}</Badge>
                {client && (
                  <Link to={`/clients/${client.id}?tab=petitions`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80">
                      <User className="h-3 w-3 mr-1" />
                      {client.name}
                    </Badge>
                  </Link>
                )}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownloadFormat('pdf')}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadFormat('docx')}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar DOCX
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadFormat('json')}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar JSON
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopy}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar texto
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button onClick={handleEditMode} size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}

              {isEditing && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditedTitle(petition.title);
                    setEditedContent(petition.content);
                    setEditedCategory(petition.category);
                    setEditedClientId(petition.clientId || '');
                    setIsEditing(false);
                    setCurrentTab('preview');
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveChanges} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:max-w-none">
        {isEditing ? (
          <Card>
            <CardContent className="p-6">
              {/* Editing fields */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Título da Petição</Label>
                    <Input 
                      id="title" 
                      value={editedTitle} 
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={editedCategory} onValueChange={setEditedCategory}>
                      <SelectTrigger id="category" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="civil">Cível</SelectItem>
                        <SelectItem value="criminal">Criminal</SelectItem>
                        <SelectItem value="social-security">Previdenciário</SelectItem>
                        <SelectItem value="labor">Trabalhista</SelectItem>
                        <SelectItem value="administrative">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="client">Cliente (opcional)</Label>
                  <Select value={editedClientId} onValueChange={setEditedClientId}>
                    <SelectTrigger id="client" className="mt-1">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum cliente</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Edit/Preview tabs */}
              <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visualização
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit" className="mt-0">
                  <RichTextEditor value={editedContent} onChange={setEditedContent} />
                </TabsContent>
                
                <TabsContent value="preview" className="mt-0">
                  <PetitionPreview content={editedContent} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          /* Preview mode - document focused */
          <div className="space-y-4">
            {/* Document title */}
            <div className="text-center mb-8 print:mb-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-4xl">
                {petition.title}
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 print:hidden">
                <span>Criado em {new Date(petition.createdAt).toLocaleDateString('pt-BR')}</span>
                <span>•</span>
                <span>Atualizado {formatDistanceToNow(new Date(petition.updatedAt), { addSuffix: true, locale: ptBR })}</span>
              </div>
            </div>

            {/* Document content */}
            <PetitionPreview content={petition.content} className="print:border-none print:shadow-none print:p-0" />
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Petição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta petição? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePetition} 
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PetitionDetailPage;
