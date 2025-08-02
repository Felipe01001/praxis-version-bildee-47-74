
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText,
  X,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { usePraxisContext } from '@/context/PraxisContext';
import { v4 as uuidv4 } from 'uuid';

const ImportPetitionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  
  const { 
    clients,
    addPetition
  } = usePraxisContext();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [clientId, setClientId] = useState(clientIdParam || '');
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Efeito para pré-selecionar o cliente se fornecido na URL
  useEffect(() => {
    if (clientIdParam) {
      setClientId(clientIdParam);
    }
  }, [clientIdParam]);
  
  // Função para lidar com o upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Verifica se é um formato aceitável
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)) {
      toast.error('Formato de arquivo não suportado. Use PDF, DOCX ou TXT');
      return;
    }
    
    setFileName(file.name);
    setFileSize(file.size);
    
    // Se o título estiver vazio, usa o nome do arquivo como título
    if (!title) {
      const titleFromFileName = file.name.split('.').slice(0, -1).join('.');
      setTitle(titleFromFileName);
    }
    
    // Ler conteúdo do arquivo (simulado para TXT, em produção usaria OCR ou extrator de texto)
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setContent(content);
      };
      reader.readAsText(file);
    } else {
      // Simula extração de conteúdo para arquivos PDF/DOCX
      setIsUploading(true);
      
      // Simulação do tempo de processamento
      setTimeout(() => {
        setIsUploading(false);
        setContent(`# ${title || file.name}\n\nConteúdo extraído do documento ${file.name}.\n\n[Este é um texto simulado para fins de demonstração. Em uma implementação real, o conteúdo seria extraído do documento carregado usando um serviço de OCR ou extração de texto.]`);
        toast.success('Conteúdo do documento extraído com sucesso');
      }, 2000);
    }
  };
  
  // Função para importar petição
  const handleImport = () => {
    if (!title) {
      toast.error('Por favor, informe um título para a petição');
      return;
    }
    
    if (!category) {
      toast.error('Por favor, selecione uma categoria');
      return;
    }
    
    if (!content) {
      toast.error('O conteúdo da petição não pode estar vazio');
      return;
    }
    
    try {
      // Adicionar nova petição
      const newPetition = {
        id: uuidv4(),
        title,
        content,
        category,
        clientId: clientId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isImported: true,
        fileName,
        fileSize
      };
      
      addPetition(newPetition);
      
      toast.success('Petição importada com sucesso!');
      navigate(`/petitions/${newPetition.id}`);
    } catch (error) {
      console.error('Erro ao importar petição:', error);
      toast.error('Erro ao importar petição. Tente novamente.');
    }
  };
  
  // Função para limpar o arquivo
  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileName('');
    setFileSize(0);
  };
  
  // Formata o tamanho do arquivo
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/petitions')}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Importar Petição</h1>
        </div>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-praxis-olive" />
            Importar Documento Existente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file">Selecione o documento</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx,.txt"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="max-w-md"
              />
              {fileName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {fileName && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{fileName}</span>
                <span className="text-xs">({formatFileSize(fileSize)})</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Título da Petição</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da petição"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
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
          
          <div className="space-y-2">
            <Label htmlFor="client">Vincular a Cliente (opcional)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            {isUploading ? (
              <div className="h-60 border rounded-md flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-praxis-olive" />
                  <p>Extraindo conteúdo do documento...</p>
                </div>
              </div>
            ) : (
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] font-mono"
                placeholder="O conteúdo do documento aparecerá aqui após o upload"
              />
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/petitions')}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              className="bg-praxis-olive hover:bg-praxis-olive/90"
              disabled={isUploading || !title || !category || !content}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar Petição
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportPetitionPage;
