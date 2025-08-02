import React, { useState } from 'react';
import { Plus, Upload, Search, FileText, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePetitionTemplates } from '@/hooks/usePetitionTemplates';
import { CategoryManager } from '@/components/petition/CategoryManager';
import { TemplateViewerModal } from '@/components/petition/TemplateViewerModal';
import { PetitionTemplateWithFiles } from '@/types/petition-template';
import { toast } from 'sonner';

const templateFormSchema = z.object({
  tema: z.string().min(1, 'Tema é obrigatório'),
  subtema: z.string().min(1, 'Subtema é obrigatório'),
  titulo: z.string().min(1, 'Título é obrigatório'),
  ordem: z.string().min(1, 'Ordem é obrigatória'),
  descricao: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

const TEMAS_PREDEFINIDOS = [
  'PETIÇÃO GERAL',
  'ACIDENTE DE TRÂNSITO',
  'BANCO-CARTÃO DE CRÉDITO',
  'COBRANÇA DE DÍVIDA',
  'COMPRA DE PRODUTO – CONSUMIDOR',
  'CONDOMÍNIO-DIREITO DE VIZINHANÇA',
  'DESPEJO PARA USO PRÓPRIO',
  'ESTABELECIMENTO DE ENSINO',
  'EXECUÇÃO DE TÍTULO EXTRAJUDICIAL',
  'EXECUÇÃO DE TÍTULO JUDICIAL',
  'LOCAÇÃO DE IMÓVEL',
  'NEGATIVAÇÃO INDEVIDA',
  'OPERADORA DE TURISMO',
  'PLANOS DE SAÚDE',
  'PRESTAÇÃO DE SERVIÇOS – CONSUMIDOR',
  'TELEFONIA-TV-INTERNET',
  'TRANSPORTE AÉREO',
  'TRANSPORTE RODOVIÁRIO',
  'VEÍCULOS, exceto COLISÃO',
  'JUIZADOS ESPECIAIS DA FAZENDA DO DF',
  'AÇÕES CONTRA CAESB e CEB',
  'COMPRA E VENDA ENTRE PARTICULARES',
  'CONSÓRCIO',
];

export const TemplateManagementPage = () => {
  const { templates, loading, createTemplate, uploadFile, fetchTemplates, downloadFile, deleteTemplate, deleteFile } = usePetitionTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PetitionTemplateWithFiles | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      tema: '',
      subtema: '',
      titulo: '',
      ordem: '',
      descricao: '',
    },
  });

  const onSubmit = async (values: TemplateFormValues) => {
    try {
      const templateData = {
        tema: values.tema,
        subtema: values.subtema,
        titulo: values.titulo,
        ordem: values.ordem,
        descricao: values.descricao || undefined,
      };
      
      await createTemplate(templateData);
      setIsCreateDialogOpen(false);
      form.reset();
      toast.success('Modelo criado com sucesso');
    } catch (error) {
      toast.error('Erro ao criar modelo');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, templateId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      toast.error('Apenas arquivos PDF e DOCX são permitidos');
      return;
    }

    await uploadFile(file, templateId);
    event.target.value = '';
  };

  const handleViewTemplate = (template: PetitionTemplateWithFiles) => {
    setSelectedTemplate(template);
    setIsViewerOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    if (confirm(`Tem certeza que deseja deletar o modelo "${templateTitle}"? Esta ação não pode ser desfeita.`)) {
      await deleteTemplate(templateId);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (confirm(`Tem certeza que deseja deletar o arquivo "${fileName}"?`)) {
      await deleteFile(fileId);
    }
  };

  const handleAddTemplate = async (categoryTitle: string, itemTitle: string, order: string) => {
    try {
      const templateData = {
        tema: categoryTitle,
        subtema: 'Geral',
        titulo: itemTitle,
        ordem: order,
        descricao: `Modelo para ${itemTitle}`,
      };
      
      await createTemplate(templateData);
      toast.success('Modelo adicionado com sucesso');
    } catch (error) {
      toast.error('Erro ao adicionar modelo');
    }
  };

  const handleCategoryFileUpload = async (itemId: string, file: File) => {
    await uploadFile(file, itemId);
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    await downloadFile(fileUrl, fileName);
  };

  const filteredTemplates = templates.filter(template =>
    template.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subtema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Modelos de Petições</h1>
          <p className="text-muted-foreground">
            Gerencie os modelos organizados por tema e subtema ({templates.length} modelos disponíveis)
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-praxis-olive hover:bg-praxis-olive/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Modelo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Modelo</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tema</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tema" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEMAS_PREDEFINIDOS.map(tema => (
                            <SelectItem key={tema} value={tema}>{tema}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtema</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Indenização por Danos Morais" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do modelo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1.1.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição do modelo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Modelo</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categorias Estruturadas</TabsTrigger>
          <TabsTrigger value="templates">Todos os Modelos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <CategoryManager 
            onAddTemplate={handleAddTemplate}
            onFileUpload={handleCategoryFileUpload}
          />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          {/* Busca */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar modelos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchTemplates}>
              Atualizar
            </Button>
          </div>

          {/* Lista de modelos */}
          {loading ? (
            <div className="text-center py-8">Carregando modelos...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base line-clamp-2">{template.titulo}</CardTitle>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{template.tema}</Badge>
                          <Badge variant="outline" className="text-xs">{template.subtema}</Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{template.ordem}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {template.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.descricao}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {template.files.length} arquivo(s)
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTemplate(template)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.docx"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, template.id)}
                          />
                          <Button variant="ghost" size="sm" asChild title="Upload">
                            <span>
                              <Upload className="h-4 w-4" />
                            </span>
                          </Button>
                        </label>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id, template.titulo)}
                          title="Deletar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Lista de arquivos */}
                    {template.files.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Arquivos:</p>
                        {template.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between text-xs bg-muted/30 rounded p-2">
                            <span className="truncate flex-1">{file.arquivo_nome}</span>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {file.tipo.toUpperCase()}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(file.arquivo_url, file.arquivo_nome)}
                                title="Download"
                                className="h-6 w-6 p-0"
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFile(file.id, file.arquivo_nome)}
                                title="Deletar arquivo"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredTemplates.length === 0 && !loading && (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-lg font-medium">Nenhum modelo encontrado</p>
                <p className="text-muted-foreground">Crie seu primeiro modelo de petição</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <TemplateViewerModal 
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
};

export default TemplateManagementPage;
