
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Search, Plus, Calendar, User, ArrowRight, FileCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JudicialProcess } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { usePraxisContext } from '@/context/PraxisContext';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

// Properly typed component props
interface JudicialProcessesCardProps {
  clientId?: string;
  judicialProcesses?: JudicialProcess[];
}

// Função para formatar o número do processo
const formatProcessNumber = (number?: string) => {
  if (!number || typeof number !== 'string') {
    return 'N/A';
  }
  
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

const JudicialProcessesCard = ({ 
  clientId,
  judicialProcesses = [] // Default to empty array if not provided
}: JudicialProcessesCardProps) => {
  const { headerColor } = useTheme();
  const { clients } = usePraxisContext();
  const navigate = useNavigate();
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não identificado';
  };

  // Formatar a data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'N/A';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" style={{ color: headerColor }} />
          Processos Judiciais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {judicialProcesses && judicialProcesses.length > 0 ? (
            <>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 gap-3">
                  {judicialProcesses.slice(0, 6).map((process) => (
                    <div 
                      key={process.id}
                      className="border rounded-lg p-4 hover:border-praxis-olive hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/judicial-processes/${process.id}`)}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-praxis-olive" />
                            <h4 className="font-medium text-sm">
                              {formatProcessNumber(process.numeroProcesso)}
                            </h4>
                          </div>
                          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileCheck className="h-3 w-3" />
                              <span>{process.tribunal}</span>
                            </div>
                            {process.clientId && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <Link 
                                  to={`/clients/${process.clientId}`}
                                  className="text-praxis-olive hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {getClientName(process.clientId)}
                                </Link>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Atualizado: {formatDate(process.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-4">
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/judicial-processes">Ver todos os processos judiciais</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum processo judicial encontrado.
              <div className="mt-4 flex flex-col gap-2">
                <SubscriptionAccessWrapper action="criar um novo processo judicial">
                  <Button asChild variant="outline">
                    <Link to={clientId ? `/clients/${clientId}/judicial` : "/judicial-processes/new"}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar processo judicial
                    </Link>
                  </Button>
                </SubscriptionAccessWrapper>
                <SubscriptionAccessWrapper action="pesquisar um processo judicial">
                  <Button asChild variant="default" style={{ backgroundColor: headerColor }}>
                    <Link to="/judicial-processes/search">
                      <Search className="h-4 w-4 mr-2" />
                      Pesquisar processo
                    </Link>
                  </Button>
                </SubscriptionAccessWrapper>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JudicialProcessesCard;
