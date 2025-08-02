
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/petition/RichTextEditor';
import { TemplateSelectionCard } from '@/components/petition/TemplateSelectionCard';
import { PetitionPreview } from '@/components/petition/PetitionPreview';
import { Petition } from '@/types';
import { FileText, Sparkles, Eye, Edit3, Download } from 'lucide-react';
import { useDownload } from '@/hooks/useDownload';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export const NewPetitionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addPetition, clients } = usePraxisContext();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [clientId, setClientId] = useState(searchParams.get('clientId') || '');
  const [activeTab, setActiveTab] = useState('ai-generation');

  // Find client name for display
  const selectedClient = clients.find(client => client.id === clientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || !category || !clientId) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const newPetition: Omit<Petition, 'id'> = {
        title,
        content,
        category,
        clientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addPetition(newPetition);
      toast.success('Petição criada com sucesso!');
      navigate('/petitions');
    } catch (error) {
      console.error('Erro ao criar petição:', error);
      toast.error('Erro ao criar petição');
    }
  };

  const handleContentGenerated = (generatedContent: string, templateTitle?: string) => {
    console.log('=== PÁGINA: CONTEÚDO GERADO RECEBIDO ===');
    console.log('Tamanho do conteúdo:', generatedContent.length);
    console.log('Template título:', templateTitle);
    
    setContent(generatedContent);
    
    // Auto-fill title if provided from template
    if (templateTitle && !title) {
      setTitle(templateTitle);
    }
    
    setActiveTab('edit');
    
    toast.success('Petição gerada com sucesso!', {
      description: 'Você pode editá-la na aba "Editar" e visualizar na aba "Visualizar".'
    });
  };

  // Auto-generate title based on content only if no title is set
  useEffect(() => {
    if (content && !title) {
      const lines = content.split('\n');
      const firstMeaningfulLine = lines.find(line => 
        line.trim().length > 10 && 
        !line.includes('EXCELENTÍSSIMO') && 
        !line.includes('###') &&
        !line.includes('#')
      );
      if (firstMeaningfulLine) {
        setTitle(firstMeaningfulLine.trim().substring(0, 100));
      }
    }
  }, [content, title]);

  const { handleDownload, isDownloading } = useDownload();

  // Add download functionality for preview
  const handleDownloadPreview = async (format: 'pdf' | 'docx' | 'json') => {
    if (!content || !title || !clientId) {
      toast.error('Complete todas as informações antes de baixar');
      return;
    }

    const selectedClient = clients.find(client => client.id === clientId);
    const petitionData = {
      title,
      content,
      category: category || 'civil',
      clientName: selectedClient?.name,
      createdAt: new Date().toISOString()
    };

    await handleDownload(format, petitionData);
  };

  // Helper function to format marital status
  const getMaritalStatusLabel = (status: string) => {
    const statusMap = {
      'single': 'Solteiro(a)',
      'married': 'Casado(a)',
      'divorced': 'Divorciado(a)',
      'widowed': 'Viúvo(a)',
      'stable-union': 'União Estável'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Nova Petição</h1>
          <p className="text-muted-foreground">
            Gere uma nova petição com IA ou crie do zero
          </p>
        </div>
      </div>

      {/* Informações básicas - agora em cima */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações da Petição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
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

            <div>
              <Label htmlFor="title">Título da Petição *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Será preenchido automaticamente"
                required
              />
            </div>
          </div>

          {selectedClient && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-3">Dados do Cliente: {selectedClient.name}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-blue-700">
                <div>
                  <span className="font-medium">Email:</span> {selectedClient.email}
                </div>
                {selectedClient.phone && (
                  <div>
                    <span className="font-medium">Telefone:</span> {selectedClient.phone}
                  </div>
                )}
                {selectedClient.cpf && (
                  <div>
                    <span className="font-medium">CPF:</span> {selectedClient.cpf}
                  </div>
                )}
                {selectedClient.rg?.number && (
                  <div>
                    <span className="font-medium">RG:</span> {selectedClient.rg.number}
                    {selectedClient.rg.issuingBody && ` - ${selectedClient.rg.issuingBody}`}
                  </div>
                )}
                {selectedClient.birthDate && (
                  <div>
                    <span className="font-medium">Data Nasc.:</span> {new Date(selectedClient.birthDate).toLocaleDateString('pt-BR')}
                  </div>
                )}
                {selectedClient.nationality && (
                  <div>
                    <span className="font-medium">Nacionalidade:</span> {selectedClient.nationality}
                  </div>
                )}
                {selectedClient.profession && (
                  <div>
                    <span className="font-medium">Profissão:</span> {selectedClient.profession}
                  </div>
                )}
                {selectedClient.maritalStatus && (
                  <div>
                    <span className="font-medium">Estado Civil:</span> {getMaritalStatusLabel(selectedClient.maritalStatus)}
                  </div>
                )}
                {selectedClient.address && (
                  <div className="col-span-full">
                    <span className="font-medium">Endereço:</span> {selectedClient.address.street}, {selectedClient.address.number}
                    {selectedClient.address.neighborhood && `, ${selectedClient.address.neighborhood}`}
                    , {selectedClient.address.city}/{selectedClient.address.state}
                    {selectedClient.address.zipCode && ` - CEP: ${selectedClient.address.zipCode}`}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Área principal com tabs */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai-generation" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar com IA
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Editar {content && <span className="text-xs bg-green-100 text-green-800 px-1 rounded">●</span>}
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar {content && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">●</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-generation">
            {clientId ? (
              <TemplateSelectionCard
                selectedClientId={clientId}
                clients={clients}
                onContentGenerated={handleContentGenerated}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Selecione um Cliente</h3>
                    <p className="text-muted-foreground">
                      Para gerar uma petição com IA, primeiro selecione um cliente nas informações básicas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo da Petição</CardTitle>
                {content && (
                  <p className="text-sm text-muted-foreground">
                    {content.length} caracteres | {content.split('\n').length} linhas
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {content ? (
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    className="min-h-[500px]"
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Nenhum conteúdo para editar</h3>
                    <p>Gere uma petição com IA ou comece a escrever aqui.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('ai-generation')}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar com IA
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Visualização da Petição</CardTitle>
                    {content && (
                      <p className="text-sm text-muted-foreground">
                        Preview formatado do documento
                      </p>
                    )}
                  </div>
                  {content && (
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" disabled={isDownloading}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadPreview('pdf')}>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPreview('docx')}>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar DOCX
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPreview('json')}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <PetitionPreview content={content} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-3 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/petitions')}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!title || !content || !category || !clientId}
          className="bg-praxis-olive hover:bg-praxis-olive/90"
        >
          Salvar Petição
        </Button>
      </div>
    </div>
  );
};

export default NewPetitionPage;
