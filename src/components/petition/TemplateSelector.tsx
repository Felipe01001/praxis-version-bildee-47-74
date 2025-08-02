import React, { useState } from 'react';
import { Search, FileText, Download, ExternalLink, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePetitionTemplates } from '@/hooks/usePetitionTemplates';
import { usePetitionGenerator } from '@/hooks/usePetitionGenerator';
import { usePraxisContext } from '@/context/PraxisContext';
import { toast } from 'sonner';

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (content: string) => void;
  preSelectedClientId?: string;
}

export const TemplateSelector = ({ 
  open, 
  onOpenChange, 
  onTemplateSelect,
  preSelectedClientId 
}: TemplateSelectorProps) => {
  const { templates, loading, searchTemplates, downloadFile } = usePetitionTemplates();
  const { generatePetition, isGenerating } = usePetitionGenerator();
  const { clients } = usePraxisContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTema, setSelectedTema] = useState<string>('');
  const [selectedSubtema, setSelectedSubtema] = useState<string>('');
  const [selectedClientForGeneration, setSelectedClientForGeneration] = useState<string>(preSelectedClientId || '');

  // Extrair temas únicos
  const temas = Array.from(new Set(templates.map(t => t.tema))).sort();
  const subtemas = selectedTema 
    ? Array.from(new Set(templates.filter(t => t.tema === selectedTema).map(t => t.subtema))).sort()
    : [];

  const handleSearch = async () => {
    await searchTemplates(searchTerm, selectedTema, selectedSubtema);
  };

  const handleDownload = async (fileUrl: string, fileName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await downloadFile(fileUrl, fileName);
  };

  const handleOpen = (fileUrl: string, fileName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    window.open(fileUrl, '_blank');
    toast.success(`Abrindo ${fileName}`);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedTema('');
    setSelectedSubtema('');
    searchTemplates('', '', '');
  };

  const handleGenerateWithAI = async (template: any) => {
    if (!selectedClientForGeneration) {
      toast.error('Selecione um cliente para gerar a petição');
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientForGeneration);
    if (!selectedClient) {
      toast.error('Cliente não encontrado');
      return;
    }

    console.log('Generating petition for template:', template.titulo, 'and client:', selectedClient.name);

    const generatedContent = await generatePetition(template, selectedClient);
    
    if (generatedContent) {
      onTemplateSelect(generatedContent);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Modelo de Petição</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Filtros de busca */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={selectedTema} onValueChange={setSelectedTema}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os temas</SelectItem>
                {Array.from(new Set(templates.map(t => t.tema))).sort().map(tema => (
                  <SelectItem key={tema} value={tema}>{tema}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTema && (
              <Select value={selectedSubtema} onValueChange={setSelectedSubtema}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecionar subtema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os subtemas</SelectItem>
                  {Array.from(new Set(templates.filter(t => t.tema === selectedTema).map(t => t.subtema))).sort().map(subtema => (
                    <SelectItem key={subtema} value={subtema}>{subtema}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button onClick={handleReset} variant="ghost">
              Limpar
            </Button>
          </div>

          {/* Seleção de cliente para geração com IA */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium text-purple-900">Geração Inteligente de Petição</h3>
            </div>
            <div className="flex gap-2 items-center">
              <User className="h-4 w-4 text-purple-600" />
              <Select value={selectedClientForGeneration} onValueChange={setSelectedClientForGeneration}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Selecione o cliente para gerar a petição" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-purple-700">
                Selecione um cliente para gerar petições personalizadas com IA
              </span>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{templates.length} modelos encontrados</span>
            <span>•</span>
            <span>{templates.reduce((acc, t) => acc + t.files.length, 0)} arquivos disponíveis</span>
          </div>

          {/* Lista de modelos */}
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="text-center py-8">Carregando modelos...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum modelo encontrado</p>
                <p className="text-xs">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{template.titulo}</h3>
                          <Badge variant="outline" className="text-xs">
                            {template.ordem}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">{template.tema}</Badge>
                          <Badge variant="outline" className="text-xs">{template.subtema}</Badge>
                        </div>
                        {template.descricao && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {template.descricao}
                          </p>
                        )}
                        {/* Lista de arquivos */}
                        {template.files.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {template.files.map((file) => (
                              <div key={file.id} className="flex items-center justify-between text-xs bg-muted/30 rounded p-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3" />
                                  <span className="truncate flex-1">{file.arquivo_nome}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {file.tipo.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(file.arquivo_url, '_blank');
                                      toast.success(`Abrindo ${file.arquivo_nome}`);
                                    }}
                                    title="Abrir arquivo"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadFile(file.arquivo_url, file.arquivo_nome);
                                    }}
                                    title="Download"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {template.files.length} arquivo(s)
                          </div>
                          
                          {/* Botão de gerar com IA */}
                          <Button
                            onClick={() => handleGenerateWithAI(template)}
                            disabled={!selectedClientForGeneration || isGenerating}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            size="sm"
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                Gerando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-2" />
                                Gerar com IA
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
