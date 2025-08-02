import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { File, FilePlus, FileText, Upload, Download, Pencil, Trash2, Search, BookOpenText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Petition } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PetitionPreview } from '@/components/petition/PetitionPreview';
interface PetitionsTabProps {
  petitions: Petition[];
  clientId: string;
  deletePetition: (id: string) => void;
  updatePetition: (petition: Petition) => void;
}
export const PetitionsTab = ({
  petitions,
  clientId,
  deletePetition,
  updatePetition
}: PetitionsTabProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [petitionToDelete, setPetitionToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filtra petições do cliente
  const clientPetitions = petitions.filter(petition => petition.clientId === clientId);

  // Aplicar filtro de pesquisa
  const filteredPetitions = searchQuery ? clientPetitions.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())) : clientPetitions;

  // Ordena as petições por data de atualização (mais recentes primeiro)
  const sortedPetitions = [...filteredPetitions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Função para obter o texto da categoria
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

  // Confirma exclusão de petição
  const confirmDelete = (id: string) => {
    setPetitionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Exclui petição
  const handleDelete = () => {
    if (petitionToDelete) {
      deletePetition(petitionToDelete);
      toast.success('Petição excluída com sucesso');
      setIsDeleteDialogOpen(false);
      setPetitionToDelete(null);
    }
  };

  // Função para download
  const handleDownload = (format: 'pdf' | 'docx', title: string) => {
    toast.success(`Baixando petição "${title}" em formato ${format.toUpperCase()}...`);

    // Simula o download com um pequeno atraso
    setTimeout(() => {
      toast.success(`Petição baixada em formato ${format.toUpperCase()}`);
    }, 1500);
  };

  // Função para visualização rápida da petição
  const handleQuickView = (petition: Petition) => {
    setSelectedPetition(petition);
    setIsPreviewOpen(true);
  };

  // Função para editar petição
  const handleEdit = (petitionId: string) => {
    navigate(`/petitions/${petitionId}`);
  };

  // Obtém a substring do texto para exibição prévia
  const getPreviewText = (content: string, maxLength: number = 120) => {
    // Remove marcadores markdown para limpar o texto
    const cleanText = content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\_\_/g, '').replace(/\>/g, '').replace(/<div.*?>(.*?)<\/div>/g, '$1');
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };
  return <div className="space-y-4 py-[37px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Petições do Cliente</h2>
          <p className="text-muted-foreground">
            {clientPetitions.length} {clientPetitions.length === 1 ? 'petição encontrada' : 'petições encontradas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/petitions/new?clientId=${clientId}`)} className="bg-praxis-olive hover:bg-praxis-olive/90">
            <FilePlus className="mr-2 h-4 w-4" />
            Nova Petição
          </Button>
          <Button variant="outline" onClick={() => navigate(`/petitions/import?clientId=${clientId}`)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Petição
          </Button>
        </div>
      </div>

      {sortedPetitions.length > 0 && <div className="flex items-center pb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar petições..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>}

      {sortedPetitions.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPetitions.map(petition => <Card key={petition.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2">
                <Badge className="w-fit mb-2" variant="outline">
                  {getCategoryText(petition.category)}
                </Badge>
                <CardTitle className="text-base line-clamp-1">
                  <Link to={`/petitions/${petition.id}`} className="hover:underline text-green-700">
                    {petition.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {getPreviewText(petition.content)}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(petition.updatedAt), {
                addSuffix: true,
                locale: ptBR
              })}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleQuickView(petition)} title="Visualização rápida">
                      <BookOpenText className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(petition.id)} title="Editar">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload('pdf', petition.title)} title="Baixar PDF">
                      <Download className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(petition.id)} title="Excluir" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div> : <Card>
          <CardContent className="p-6">
            <div className="text-center py-10">
              <File className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-lg font-medium">Nenhuma petição encontrada</p>
              <p className="mt-1 text-muted-foreground">Crie uma nova petição ou importe uma existente</p>
              <div className="flex justify-center gap-4 mt-4">
                <Button onClick={() => navigate(`/petitions/new?clientId=${clientId}`)} className="bg-praxis-olive hover:bg-praxis-olive/90">
                  <FilePlus className="mr-2 h-4 w-4" />
                  Nova Petição
                </Button>
                <Button variant="outline" onClick={() => navigate(`/petitions/import?clientId=${clientId}`)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Petição
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Dialog para visualização rápida da petição */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedPetition?.title}</DialogTitle>
            <DialogDescription>
              {getCategoryText(selectedPetition?.category || '')} • Atualizado {selectedPetition && formatDistanceToNow(new Date(selectedPetition.updatedAt), {
              addSuffix: true,
              locale: ptBR
            })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto flex-grow">
            <ScrollArea className="h-[calc(80vh-10rem)]">
              {selectedPetition && <PetitionPreview content={selectedPetition.content} />}
            </ScrollArea>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
            if (selectedPetition) {
              navigate(`/petitions/${selectedPetition.id}`);
            }
          }} className="bg-praxis-olive hover:bg-praxis-olive/90">
              <Pencil className="mr-2 h-4 w-4" />
              Editar Petição
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default PetitionsTab;