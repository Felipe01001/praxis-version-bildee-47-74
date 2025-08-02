import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle, FileText, Check, Loader2, ArrowRight, Plus } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { JudicialProcessTimeline } from '@/components/judicial/JudicialProcessTimeline';
import { usePraxisContext } from '@/context/PraxisContext';
import { useNavigate } from 'react-router-dom';
import { TRIBUNALS } from '@/constants/tribunals';
import { supabase } from '@/integrations/supabase/client';
import { Status } from '@/types';

const SearchJudicialProcess = () => {
  const [processNumber, setProcessNumber] = useState('');
  const [tribunal, setTribunal] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [processData, setProcessData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const navigate = useNavigate();
  
  const { addJudicialProcess, clients } = usePraxisContext();
  
  const validateProcessNumber = (number: string) => {
    // Remove qualquer formatação existente
    const cleaned = number.replace(/\D/g, '');
    
    // Verifica se tem 20 caracteres (formato CNJ)
    return cleaned.length === 20;
  };
  
  const searchProcess = async () => {
    if (!tribunal) {
      setError('Selecione um tribunal para realizar a busca.');
      return;
    }
    
    if (!validateProcessNumber(processNumber)) {
      setError('Número de processo inválido. O número deve seguir o padrão do CNJ com 20 dígitos.');
      return;
    }
    
    setError(null);
    setIsSearching(true);
    setProcessData(null);
    
    try {
      // Chama a função edge do Supabase
      const { data, error } = await supabase.functions.invoke("datajud", {
        body: {
          numeroProcesso: processNumber.replace(/\D/g, ''),
          tribunal: tribunal
        }
      });
      
      if (error) {
        console.error('Erro ao chamar a API:', error);
        setError(`Erro ao consultar o processo: ${error.message}`);
        return;
      }
      
      if (data.error) {
        setError(data.message || data.error);
        return;
      }
      
      if (!data.found) {
        setError(`Processo não encontrado no tribunal ${tribunal}.`);
        return;
      }
      
      setProcessData(data.data);
      toast.success("Processo encontrado", {
        description: "Os dados do processo foram carregados com sucesso."
      });
    } catch (err) {
      console.error('Erro ao buscar o processo:', err);
      setError('Ocorreu um erro ao buscar os dados do processo. Tente novamente mais tarde.');
    } finally {
      setIsSearching(false);
    }
  };
  
  const formatProcessNumber = (number: string) => {
    // Remove caracteres não numéricos
    const cleaned = number.replace(/\D/g, '');
    
    // Aplica a formatação CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
    if (cleaned.length <= 7) {
      return cleaned;
    }
    
    let formatted = cleaned.substring(0, 7);
    
    if (cleaned.length > 7) {
      formatted += '-' + cleaned.substring(7, 9);
    }
    
    if (cleaned.length > 9) {
      formatted += '.' + cleaned.substring(9, 13);
    }
    
    if (cleaned.length > 13) {
      formatted += '.' + cleaned.substring(13, 14);
    }
    
    if (cleaned.length > 14) {
      formatted += '.' + cleaned.substring(14, 16);
    }
    
    if (cleaned.length > 16) {
      formatted += '.' + cleaned.substring(16);
    }
    
    return formatted;
  };

  const handleProcessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatProcessNumber(e.target.value);
    setProcessNumber(formattedNumber);
  };
  
  const handleSaveProcess = async () => {
    if (!processData) return;
    
    try {
      const cleanedNumber = processNumber.replace(/\D/g, '');
      
      const currentDate = new Date().toISOString();
      // Use selectedClientId se fornecido, senão null
      const savedProcess = await addJudicialProcess({
        clientId: selectedClientId || null,
        court: processData.court || 'Não especificado',
        processNumber: cleanedNumber,
        phase: processData.phase || 'Inicial',
        defendant: processData.defendant || 'Não especificado',
        status: 'analysis' as Status,
        numeroProcesso: cleanedNumber,
        tribunal: tribunal,
        dataCadastro: currentDate,
        updatedAt: currentDate,
        lastResponse: processData
      });
      toast.success('Processo salvo com sucesso', {
        description: 'O processo foi adicionado à sua lista de processos judiciais'
      });
      
      // Redireciona para a página de detalhes do processo recém-adicionado
      navigate(`/judicial-processes/${savedProcess.id}`);
    } catch (error) {
      console.error('Erro ao salvar processo:', error);
      toast.error('Erro ao salvar processo', {
        description: 'Tente novamente mais tarde'
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text">
        Pesquisar Processo Judicial
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-praxis-olive" />
            Consulta DataJud CNJ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Número do Processo</label>
                <Input
                  placeholder="0000000-00.0000.0.00.0000"
                  value={processNumber}
                  onChange={handleProcessNumberChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: NNNNNNN-DD.AAAA.J.TR.OOOO (Padrão CNJ)
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Tribunal</label>
                <Select 
                  value={tribunal} 
                  onValueChange={setTribunal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tribunal" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIBUNALS.map(tribunal => (
                      <SelectItem key={tribunal.value} value={tribunal.value}>
                        {tribunal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={searchProcess} 
              disabled={!processNumber || !tribunal || isSearching}
              className="w-full"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Processo
                </>
              )}
            </Button>
          </div>
          
          {processData && (
            <div className="mt-8 space-y-6">
              <div className="mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <h3 className="font-bold text-lg">Processo Encontrado</h3>
              </div>
              
              <div className="border rounded-md">
                <div className="p-4 border-b bg-muted/30">
                  <h4 className="font-semibold">Linha do Tempo do Processo</h4>
                </div>
                
                <div className="p-4">
                  <JudicialProcessTimeline
                    process={{
                      id: 'temp',
                      clientId: '',
                      court: processData.court || 'Não especificado',
                      processNumber: processNumber.replace(/\D/g, ''),
                      phase: processData.phase || 'Inicial',
                      defendant: processData.defendant || 'Não especificado',
                      status: 'analysis' as Status,
                      numeroProcesso: processNumber.replace(/\D/g, ''),
                      tribunal,
                      lastResponse: {
                        data: processData
                      },
                      updatedAt: new Date().toISOString(),
                      dataCadastro: new Date().toISOString()
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Cliente (Opcional)</label>
                  <Select 
                    value={selectedClientId} 
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente ou deixe em branco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem cliente vinculado</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProcessNumber('');
                      setTribunal('');
                      setProcessData(null);
                      setError(null);
                      setSelectedClientId('');
                    }}
                  >
                    Nova Consulta
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex items-center gap-2"
                    onClick={handleSaveProcess}
                  >
                    <Plus className="h-4 w-4" />
                    Salvar Processo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchJudicialProcess;