import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { File, FilePlus, FileText, Upload, Download, Pencil, Trash2, Search, BookOpenText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePraxisContext } from '@/context/PraxisContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useDownload } from '@/hooks/useDownload';
import { useHoverEffect } from '@/hooks/useHoverEffect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

export const PetitionList = () => {
  const navigate = useNavigate();
  const {
    petitions,
    deletePetition,
    clients
  } = usePraxisContext();
  const [searchQuery, setSearchQuery] = useState('');
  const { handleDownload, isDownloading } = useDownload();
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();

  // Aplicar filtro de pesquisa
  const filteredPetitions = searchQuery ? petitions.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())) : petitions;

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
  const confirmDelete = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a petição "${title}"?`)) {
      deletePetition(id);
      toast.success('Petição excluída com sucesso');
    }
  };

  // Função para download
  const handleDownloadPetition = async (petition: any, format: 'pdf' | 'docx' | 'json') => {
    const client = clients.find(c => c.id === petition.clientId);
    const petitionData = {
      title: petition.title,
      content: petition.content,
      category: petition.category,
      clientName: client?.name,
      createdAt: petition.createdAt
    };

    await handleDownload(format, petitionData);
  };

  // Obtém a substring do texto para exibição prévia
  const getPreviewText = (content: string, maxLength: number = 120) => {
    // Remove marcadores markdown para limpar o texto
    const cleanText = content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\_\_/g, '').replace(/\>/g, '').replace(/<div.*?>(.*?)<\/div>/g, '$1');
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Petições</h1>
          <p className="text-muted-foreground">
            {petitions.length} {petitions.length === 1 ? 'petição encontrada' : 'petições encontradas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/petitions/templates')}>
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Modelos
          </Button>
          <SubscriptionAccessWrapper action="criar uma nova petição">
            <Button onClick={() => navigate('/petitions/new')} className="bg-praxis-olive hover:bg-praxis-olive/90">
              <FilePlus className="mr-2 h-4 w-4" />
              Nova Petição
            </Button>
          </SubscriptionAccessWrapper>
          
        </div>
      </div>

      {sortedPetitions.length > 0 && <div className="flex items-center pb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar petições..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>}

      {sortedPetitions.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPetitions.map(petition => <Card 
              key={petition.id} 
              className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
              onMouseLeave={handleMouseLeave}
            >
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
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/petitions/${petition.id}`)} title="Visualizar">
                      <BookOpenText className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/petitions/${petition.id}`)} title="Editar">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title="Baixar" disabled={isDownloading}>
                          <Download className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownloadPetition(petition, 'pdf')}>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPetition(petition, 'docx')}>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar DOCX
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPetition(petition, 'json')}>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar JSON
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(petition.id, petition.title)} title="Excluir" className="text-red-500 hover:bg-red-50 hover:text-red-600">
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
                <SubscriptionAccessWrapper action="criar uma nova petição">
                  <Button onClick={() => navigate('/petitions/new')} className="bg-praxis-olive hover:bg-praxis-olive/90">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Nova Petição
                  </Button>
                </SubscriptionAccessWrapper>
                <Button variant="outline" onClick={() => navigate('/petitions/import')}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Petição
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default PetitionList;
