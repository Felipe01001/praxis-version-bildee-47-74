
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { JudicialProcessTimeline } from '@/components/judicial/JudicialProcessTimeline';
import ProcessAttachments from '@/components/judicial/ProcessAttachments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share, Download, FileText, ArrowLeft, RefreshCw, User } from 'lucide-react';

const JudicialProcessDetailPage = () => {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  const { judicialProcesses, clients, updateJudicialProcess } = usePraxisContext();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  
  // Buscar o processo judicial pelo ID
  const process = judicialProcesses.find(p => p.id === processId);
  
  // Buscar o cliente associado ao processo
  const client = process?.clientId ? clients.find(c => c.id === process.clientId) : null;
  
  // Se o processo não foi encontrado
  if (!process) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Processo não encontrado</h2>
        <p className="text-muted-foreground mb-6">O processo que você está procurando não existe ou foi removido.</p>
        <Button 
          variant="outline"
          onClick={() => navigate('/judicial-processes')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista de processos
        </Button>
      </div>
    );
  }

  // Formatar o número do processo no padrão CNJ
  const formatProcessNumber = (number: string) => {
    // Handle undefined or null values
    if (!number) return 'N/A';
    
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
  
  // Atualizar os dados do processo
  const handleRefreshData = async () => {
    setIsLoading(true);
    
    try {
      // Chamada para a função Edge do Supabase
      const { data, error } = await supabase.functions.invoke('datajud', {
        body: {
          numeroProcesso: process.processNumber || process.numeroProcesso,
          tribunal: process.tribunal
        }
      });
      
      if (error) {
        toast.error(`Erro ao atualizar os dados: ${error.message}`);
        return;
      }
      
      if (data.error) {
        toast.error(data.message || data.error);
        return;
      }
      
      if (!data.found) {
        toast.error(`Processo não encontrado no tribunal ${process.tribunal}.`);
        return;
      }
      
      // Atualizar o processo no contexto
      updateJudicialProcess({
        ...process,
        lastResponse: data.data,
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Dados do processo atualizados com sucesso');
    } catch (err) {
      console.error('Erro ao atualizar processo:', err);
      toast.error('Ocorreu um erro ao buscar os dados atualizados do processo');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatar a data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  // Baixar os dados do processo como JSON
  const handleExportJson = () => {
    if (!process.lastResponse) {
      toast.error('Não há dados disponíveis para exportar');
      return;
    }
    
    const dataStr = JSON.stringify(process.lastResponse, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileName = `processo_${(process.processNumber || process.numeroProcesso || '0000000').substring(0, 7)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    linkElement.remove();
    
    toast.success('Arquivo JSON exportado com sucesso');
  };

  // Compartilhar o processo
  const handleShare = async () => {
    const url = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Processo ${process.processNumber || process.numeroProcesso}`,
          text: `Detalhes do Processo ${formatProcessNumber(process.processNumber || process.numeroProcesso)} - ${process.tribunal}`,
          url: url
        });
      } else {
        // Fallback para navegadores que não suportam a API Web Share
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            className="mb-2"
            onClick={() => navigate('/judicial-processes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text flex flex-wrap items-center gap-2">
            Processo {formatProcessNumber(process.processNumber || process.numeroProcesso)}
            <Badge variant="outline" className="ml-2">
              {process.tribunal}
            </Badge>
          </h1>
          
          {client && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Cliente: </span>
              <Button 
                variant="link" 
                className="p-0 h-auto text-praxis-olive"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                {client.name}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share className="h-4 w-4" />
            Compartilhar
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleExportJson}
            className="flex items-center gap-2"
            disabled={!process.lastResponse}
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
          
          <Button 
            onClick={handleRefreshData} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {isLoading ? 'Atualizando...' : 'Atualizar Dados'}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-praxis-olive" />
                Detalhes do Processo
              </CardTitle>
              <CardDescription>
                Última atualização: {formatDate(process.updatedAt)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
              <TabsTrigger value="details">Informações</TabsTrigger>
              <TabsTrigger value="parties">Partes</TabsTrigger>
              <TabsTrigger value="attachments">Anexos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="mt-0">
              <JudicialProcessTimeline 
                process={process} 
                onRefresh={handleRefreshData}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="details">
              {process.lastResponse ? (
                <div className="space-y-6">
                  <ProcessDetails process={process} />
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    Não há dados detalhados disponíveis para este processo.
                  </p>
                  <Button 
                    onClick={handleRefreshData} 
                    disabled={isLoading}
                    className="mt-4"
                  >
                    {isLoading ? 'Buscando dados...' : 'Buscar Dados do Processo'}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="parties">
              {process.lastResponse ? (
                <ProcessParties process={process} />
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    Não há dados sobre as partes disponíveis para este processo.
                  </p>
                  <Button 
                    onClick={handleRefreshData} 
                    disabled={isLoading}
                    className="mt-4"
                  >
                    {isLoading ? 'Buscando dados...' : 'Buscar Dados do Processo'}
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="attachments">
              <ProcessAttachments processId={process.id} clientId={process.clientId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para mostrar os detalhes do processo
const ProcessDetails = ({ process }: { process: any }) => {
  const processData = process.lastResponse?.data ? 
    process.lastResponse.data.hits?.hits?.[0]?._source : 
    process.lastResponse?.hits?.hits?.[0]?._source;
  
  if (!processData) {
    return <div className="text-center py-4">Dados não disponíveis</div>;
  }
  
  // Lista de detalhes do processo a serem exibidos
  const detailItems = [
    { label: 'Data de Ajuizamento', value: formatDate(processData.dataAjuizamento) },
    { label: 'Grau', value: processData.grau },
    { label: 'Classe', value: processData.classe?.nome },
    { label: 'Nível de Sigilo', value: processData.nivelSigilo },
    { label: 'Formato', value: processData.formato?.nome },
    { label: 'Órgão Julgador', value: processData.orgaoJulgador?.nome },
    { label: 'Comarca/Seção', value: processData.orgaoJulgador?.codigoMunicipioIBGE },
  ];
  
  // Função para formatar a data
  function formatDate(dateString: string) {
    if (!dateString) return 'Não informado';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {detailItems.map((item, index) => (
          item.value ? (
            <div key={index} className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">{item.label}</div>
              <div className="font-medium">{item.value}</div>
            </div>
          ) : null
        ))}
      </div>
      
      {processData.assuntos?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Assuntos do Processo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processData.assuntos.map((assunto: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded-md border">
                <p className="font-medium">{assunto.nome || 'Assunto sem nome'}</p>
                {assunto.codigo && (
                  <p className="text-xs text-muted-foreground">Código: {assunto.codigo}</p>
                )}
                {assunto.principal && (
                  <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 hover:bg-blue-100">
                    Principal
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para exibir as partes do processo
const ProcessParties = ({ process }: { process: any }) => {
  const processData = process.lastResponse?.data ? 
    process.lastResponse.data.hits?.hits?.[0]?._source : 
    process.lastResponse?.hits?.hits?.[0]?._source;
  
  if (!processData || !processData.polo) {
    return <div className="text-center py-4">Dados das partes não disponíveis</div>;
  }
  
  return (
    <div className="space-y-6">
      {processData.polo.map((polo: any, index: number) => (
        <div key={index} className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 p-3 font-medium">
            {polo.polo === 'AT' ? 'Polo Ativo (Autor)' : 
             polo.polo === 'PA' ? 'Polo Passivo (Réu)' : 
             polo.polo === 'TC' ? 'Terceiro Interessado' : 
             `Polo ${polo.polo}`}
          </div>
          <div className="p-3">
            {polo.pessoa?.map((pessoa: any, pessoaIndex: number) => (
              <div key={pessoaIndex} className="mb-3 last:mb-0 p-3 bg-gray-50 rounded-md">
                <div className="font-medium">{pessoa.nome}</div>
                <div className="text-sm text-muted-foreground">
                  {pessoa.tipoPessoa === 'fisica' ? 'Pessoa Física' : 
                   pessoa.tipoPessoa === 'juridica' ? 'Pessoa Jurídica' : 
                   pessoa.tipoPessoa}
                </div>
                {pessoa.documento && (
                  <div className="text-sm mt-1">
                    Documento: {pessoa.documento}
                  </div>
                )}
                
                {pessoa.representante && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-sm font-medium">Representante(s):</div>
                    {Array.isArray(pessoa.representante) ? (
                      pessoa.representante.map((rep: any, repIndex: number) => (
                        <div key={repIndex} className="ml-2 mt-1 text-sm">
                          {rep.nome || rep}
                        </div>
                      ))
                    ) : (
                      <div className="ml-2 mt-1 text-sm">
                        {pessoa.representante.nome || pessoa.representante}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JudicialProcessDetailPage;
