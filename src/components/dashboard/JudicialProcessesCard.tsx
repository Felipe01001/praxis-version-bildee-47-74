
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Search, Plus, Calendar, User, ArrowRight, FileCheck, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JudicialProcess } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { usePraxisContext } from '@/context/PraxisContext';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';
import { useHoverEffect } from '@/hooks/useHoverEffect';
import { useState } from 'react';

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
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();
  const [tribunalFilter, setTribunalFilter] = useState<string>('all');
  
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

  // Get unique tribunals for filter
  const uniqueTribunals = ['all', ...Array.from(new Set(judicialProcesses.map(p => p.tribunal).filter(Boolean)))];

  // Filter judicial processes
  const filteredProcesses = judicialProcesses.filter(process => {
    const tribunalMatch = tribunalFilter === 'all' || process.tribunal === tribunalFilter;
    return tribunalMatch;
  });

  const sortedProcesses = filteredProcesses.sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.dataCadastro || '');
    const dateB = new Date(b.updatedAt || b.dataCadastro || '');
    return dateB.getTime() - dateA.getTime();
  });
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Processos Judiciais
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredProcesses.length} {filteredProcesses.length === 1 ? 'processo' : 'processos'}
          </p>
        </div>
        <SubscriptionAccessWrapper action="pesquisar um processo judicial">
          <Button asChild>
            <Link to="/judicial-processes/search">
              <Search className="h-4 w-4 mr-2" />
              Pesquisar Processo
            </Link>
          </Button>
        </SubscriptionAccessWrapper>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={tribunalFilter} onValueChange={(value: string) => setTribunalFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tribunais</SelectItem>
              {uniqueTribunals.slice(1).map((tribunal) => (
                <SelectItem key={tribunal} value={tribunal}>{tribunal}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {sortedProcesses.length > 0 ? (
          <div className="space-y-3">
            {sortedProcesses.slice(0, 5).map((process) => (
              <div 
                key={process.id}
                className="border rounded-lg p-4 cursor-pointer transition-colors"
                onClick={() => navigate(`/judicial-processes/${process.id}`)}
                onMouseEnter={(e) => handleMouseEnter(e, 0.1)}
                onMouseLeave={handleMouseLeave}
               >
                <div className="flex flex-col gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" style={{ color: headerColor }} />
                      <h4 className="font-medium text-sm">
                        {formatProcessNumber(process.processNumber)}
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
                            className="hover:underline"
                            style={{ color: headerColor }}
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
            {sortedProcesses.length > 5 && (
              <div className="text-center pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/judicial-processes')}
                >
                  Ver mais {sortedProcesses.length - 5} processos
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Nenhum processo judicial encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JudicialProcessesCard;
