import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { JudicialProcess, Status } from '@/types';
import { Folder, FileSearch, RefreshCw, HelpCircle, AlertTriangle, Info, Clock, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { TRIBUNALS } from '@/constants/tribunals';
import { supabase } from '@/integrations/supabase/client';
import { JudicialProcessTimeline } from '@/components/judicial/JudicialProcessTimeline';
interface JudicialProcessTabProps {
  clientId: string;
}
export const JudicialProcessTab = ({
  clientId
}: JudicialProcessTabProps) => {
  const navigate = useNavigate();
  const {
    judicialProcesses,
    addJudicialProcess,
    updateJudicialProcess
  } = usePraxisContext();
  const clientProcesses = judicialProcesses.filter(p => p.clientId === clientId);
  const [isAddingProcess, setIsAddingProcess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newProcess, setNewProcess] = useState({
    numeroProcesso: '',
    tribunal: ''
  });
  const [selectedProcess, setSelectedProcess] = useState<JudicialProcess | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar formato CNJ (apenas números)
    const numeroProcessoRegex = /^\d{20}$/;
    if (!numeroProcessoRegex.test(newProcess.numeroProcesso)) {
      newErrors.numeroProcesso = 'O número do processo deve conter exatamente 20 dígitos';
    }

    // Validar tribunal
    if (!newProcess.tribunal) {
      newErrors.tribunal = 'Selecione um tribunal';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const fetchProcessData = async (numeroProcesso: string, tribunal: string) => {
    setIsLoading(true);
    try {
      console.log(`Consultando processo: ${numeroProcesso} no tribunal: ${tribunal}`);

      // Usando a função Edge do Supabase em vez da API direta do DataJud
      const {
        data,
        error
      } = await supabase.functions.invoke('datajud', {
        body: {
          numeroProcesso,
          tribunal
        }
      });
      if (error) {
        console.error("Erro na chamada da função:", error);
        toast.error(`Erro ao consultar o processo: ${error.message}`, {
          duration: 6000
        });
        return null;
      }

      // Verificar se temos um erro específico retornado pela função
      if (data && data.error) {
        console.error("Erro retornado pela função:", data.error);
        toast.error(data.error, {
          description: data.message || "Ocorreu um erro ao buscar o processo",
          duration: 6000
        });
        return null;
      }

      // Verificar se o processo não foi encontrado
      if (data && data.found === false) {
        toast.error("Processo não encontrado", {
          description: data.message || `O processo ${numeroProcesso} não foi localizado na base de dados do tribunal ${tribunal}.`,
          duration: 6000
        });
        return null;
      }

      // Verificar se temos dados válidos
      if (!data || !data.data || !data.data.hits || data.data.hits?.hits?.length === 0) {
        toast.error("Dados do processo inválidos", {
          description: "A resposta da API não contém os dados esperados.",
          duration: 6000
        });
        return null;
      }
      console.log("Dados do processo encontrados:", data);
      toast.success("Processo encontrado com sucesso!");
      return data.data;
    } catch (error) {
      console.error("Erro ao buscar processo:", error);
      if (error instanceof Error) {
        toast.error("Erro ao buscar dados", {
          description: error.message,
          duration: 6000
        });
      } else {
        toast.error("Ocorreu um erro desconhecido ao buscar o processo");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  const handleAddProcess = async () => {
    if (!validateForm()) {
      toast.error('Corrija os erros no formulário');
      return;
    }
    const processData = await fetchProcessData(newProcess.numeroProcesso, newProcess.tribunal);
    if (processData) {
      const currentDate = new Date().toISOString();
      const novoProcesso = await addJudicialProcess({
        clientId,
        numeroProcesso: newProcess.numeroProcesso,
        tribunal: newProcess.tribunal.toUpperCase(),
        court: newProcess.tribunal.toUpperCase(),
        // Use tribunal as court
        processNumber: newProcess.numeroProcesso,
        // Use numeroProcesso as processNumber
        phase: "Inicial",
        // Default phase
        defendant: "Não informado",
        // Default defendant
        status: "in-progress" as Status,
        // Default status
        dataCadastro: currentDate,
        updatedAt: currentDate,
        lastResponse: processData
      });
      toast.success('Processo judicial vinculado com sucesso');
      setNewProcess({
        numeroProcesso: '',
        tribunal: ''
      });
      setIsAddingProcess(false);
      setSelectedProcess(novoProcesso);
    }
  };
  const handleUpdateProcessData = async (process: JudicialProcess) => {
    const processData = await fetchProcessData(process.numeroProcesso, process.tribunal);
    if (processData) {
      const updatedProcess = {
        ...process,
        lastResponse: processData,
        updatedAt: new Date().toISOString()
      };
      await updateJudicialProcess(updatedProcess);
      toast.success('Dados do processo atualizados com sucesso');
      // Atualizar o processo selecionado se estiver visualizando ele
      if (selectedProcess?.id === process.id) {
        setSelectedProcess(updatedProcess);
      }
    }
  };
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      return dataString;
    }
  };

  // Formatar o número do processo no padrão CNJ
  const formatProcessNumber = (number: string) => {
    // Remove qualquer formatação existente
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length <= 7) return cleaned;
    let formatted = cleaned.substring(0, 7);
    if (cleaned.length > 7) formatted += '-' + cleaned.substring(7, 9);
    if (cleaned.length > 9) formatted += '.' + cleaned.substring(9, 13);
    if (cleaned.length > 13) formatted += '.' + cleaned.substring(13, 14);
    if (cleaned.length > 14) formatted += '.' + cleaned.substring(14, 16);
    if (cleaned.length > 16) formatted += '.' + cleaned.substring(16);
    return formatted;
  };
  const renderProcessCheckTips = () => {
    return <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700">Dicas para encontrar seu processo</AlertTitle>
        <AlertDescription className="text-blue-600">
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Verifique se o número do processo está no formato correto com 20 dígitos</li>
            <li>Confirme se o tribunal selecionado é o correto onde o processo está tramitando</li>
            <li>Certifique-se de que o processo está cadastrado no sistema DataJud do CNJ</li>
            <li>Alguns processos mais antigos ou sigilosos podem não estar disponíveis via API</li>
          </ul>
        </AlertDescription>
      </Alert>;
  };
  const renderGlossary = () => {
    return <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Glossário
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Glossário dos Campos do DataJud</DialogTitle>
            <DialogDescription>
              Entenda os principais campos e termos utilizados nos processos judiciais.
            </DialogDescription>
          </DialogHeader>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="numeroProcesso">
              <AccordionTrigger>Número do Processo</AccordionTrigger>
              <AccordionContent>
                Código único de identificação do processo judicial, no formato padrão CNJ.
                Exemplo: 00012345620238040001.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="tribunal">
              <AccordionTrigger>Tribunal</AccordionTrigger>
              <AccordionContent>
                Sigla do tribunal onde o processo está tramitando.
                Exemplos: TJSP (Tribunal de Justiça de São Paulo), TRF1 (Tribunal Regional Federal da 1ª Região), STJ (Superior Tribunal de Justiça).
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="dataAjuizamento">
              <AccordionTrigger>Data de Ajuizamento</AccordionTrigger>
              <AccordionContent>
                Data em que o processo foi iniciado/distribuído no tribunal.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="grau">
              <AccordionTrigger>Grau</AccordionTrigger>
              <AccordionContent>
                Instância em que o processo está tramitando.
                Valores mais comuns: "G1" (primeiro grau), "G2" (segundo grau), "SUP" (tribunais superiores).
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="nivelSigilo">
              <AccordionTrigger>Nível de Sigilo</AccordionTrigger>
              <AccordionContent>
                Indica o nível de confidencialidade do processo.
                Valores comuns: "0" (público), "1" (segredo de justiça nível 1), "2" (segredo de justiça nível 2), etc.
                Quanto maior o número, mais restrito o acesso.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="formato">
              <AccordionTrigger>Formato</AccordionTrigger>
              <AccordionContent>
                Indica se o processo é físico ou eletrônico.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="classe">
              <AccordionTrigger>Classe</AccordionTrigger>
              <AccordionContent>
                Classificação do tipo de ação judicial conforme as tabelas processuais unificadas do CNJ.
                Exemplos: "Procedimento Comum Cível", "Mandado de Segurança", "Ação Penal".
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="assuntos">
              <AccordionTrigger>Assuntos</AccordionTrigger>
              <AccordionContent>
                Temas ou matérias discutidas no processo, conforme tabela de assuntos do CNJ.
                Exemplos: "Aposentadoria por Invalidez", "Roubo", "Revisão de Contrato".
                Um processo pode ter múltiplos assuntos, sendo um deles marcado como principal.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="orgaoJulgador">
              <AccordionTrigger>Órgão Julgador</AccordionTrigger>
              <AccordionContent>
                Vara, câmara, turma ou seção responsável pelo julgamento do processo.
                Exemplos: "1ª Vara Cível", "2ª Vara Criminal", "3ª Turma Recursal".
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="movimentos">
              <AccordionTrigger>Movimentos</AccordionTrigger>
              <AccordionContent>
                Registro das atividades processuais em ordem cronológica.
                Cada movimento possui data/hora, descrição e, opcionalmente, complementos que detalham a ação.
                Exemplos: "Distribuição", "Juntada de Documento", "Audiência Designada", "Sentença".
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </DialogContent>
      </Dialog>;
  };
  return <Card className="py-0 mx-0 my-[70px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-praxis-olive" />
          Processos Judiciais
        </CardTitle>
        <div className="flex items-center gap-2">
          {renderGlossary()}
          
          <Button onClick={() => setIsAddingProcess(!isAddingProcess)}>
            {isAddingProcess ? 'Cancelar' : 'Adicionar Processo'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAddingProcess && <div className="border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium mb-4">Vincular Processo Judicial</h3>
            
            {renderProcessCheckTips()}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">
                  Número do Processo <span className="text-destructive">*</span>
                </label>
                <Input placeholder="00012345620238040001 (20 dígitos)" value={newProcess.numeroProcesso} onChange={e => setNewProcess({
              ...newProcess,
              numeroProcesso: e.target.value.replace(/\D/g, '')
            })} className={errors.numeroProcesso ? 'border-destructive' : ''} maxLength={20} />
                {errors.numeroProcesso && <p className="text-xs text-destructive">{errors.numeroProcesso}</p>}
                <p className="text-xs text-muted-foreground">
                  Digite apenas os números, sem pontos ou traços.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">
                  Tribunal <span className="text-destructive">*</span>
                </label>
                <Select value={newProcess.tribunal} onValueChange={value => setNewProcess({
              ...newProcess,
              tribunal: value
            })}>
                  <SelectTrigger className={errors.tribunal ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione um tribunal" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIBUNALS.map(tribunal => <SelectItem key={tribunal.value} value={tribunal.value}>
                        {tribunal.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.tribunal && <p className="text-xs text-destructive">{errors.tribunal}</p>}
              </div>
            </div>
            
            <div className="flex items-center bg-blue-50 p-3 rounded-md mb-4">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-sm text-blue-700">
                Ao adicionar o processo, o sistema fará uma consulta à API pública do DataJud para obter as informações processuais.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleAddProcess} disabled={isLoading}>
                {isLoading ? 'Consultando...' : 'Vincular Processo'}
              </Button>
            </div>
          </div>}
        
        {selectedProcess ? <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={() => setSelectedProcess(null)}>
                  &larr; Voltar
                </Button>
                <h3 className="text-lg font-medium">
                  {formatProcessNumber(selectedProcess.numeroProcesso)} ({selectedProcess.tribunal})
                </h3>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => navigate(`/judicial-processes/${selectedProcess.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver página completa
              </Button>
            </div>
            
            <JudicialProcessTimeline process={selectedProcess} onRefresh={() => handleUpdateProcessData(selectedProcess)} isLoading={isLoading} />
          </div> : clientProcesses.length > 0 ? <div className="space-y-4">
            {clientProcesses.map(process => <div key={process.id} className="border rounded p-4 hover:bg-muted/30 transition cursor-pointer" onClick={() => setSelectedProcess(process)}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-praxis-olive" />
                    <div>
                      <h4 className="font-medium">{formatProcessNumber(process.numeroProcesso)}</h4>
                      <p className="text-sm text-muted-foreground">{process.tribunal}</p>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center gap-2">
                    <Badge variant="outline">
                      {process.lastResponse ? 'Dados disponíveis' : 'Pendente'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(process.dataCadastro)}
                    </p>
                    <Button variant="ghost" size="sm" onClick={e => {
                e.stopPropagation();
                setSelectedProcess(process);
              }}>
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </div>)}
          </div> : <div className="text-center py-10 text-muted-foreground">
            <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="mb-2">Nenhum processo judicial vinculado a este cliente.</p>
            <p className="text-sm">
              Clique em "Adicionar Processo" para vincular um processo judicial a este cliente.
            </p>
          </div>}
      </CardContent>
    </Card>;
};