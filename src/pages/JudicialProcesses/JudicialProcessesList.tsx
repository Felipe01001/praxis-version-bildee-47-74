
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Plus, Calendar, User, ArrowRight, FileCheck, ExternalLink } from 'lucide-react';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

const JudicialProcessesList = () => {
  const { judicialProcesses = [], clients } = usePraxisContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProcesses, setFilteredProcesses] = useState(judicialProcesses);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!judicialProcesses) return;
    
    const filtered = judicialProcesses.filter(process => {
      const matchesSearch = !searchTerm || 
        process.numeroProcesso?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        process.tribunal?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    setFilteredProcesses(filtered);
  }, [searchTerm, judicialProcesses]);
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não identificado';
  };
  
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text">Processos Judiciais</h1>
        <div className="flex gap-2">
          <SubscriptionAccessWrapper action="pesquisar um processo judicial">
            <Button asChild variant="outline">
              <Link to="/judicial-processes/search">
                <Search className="h-4 w-4 mr-2" />
                Pesquisar processo
              </Link>
            </Button>
          </SubscriptionAccessWrapper>
          <SubscriptionAccessWrapper action="criar um novo processo judicial">
            <Button asChild>
              <Link to="/judicial-processes/new">
                <Plus className="h-4 w-4 mr-2" />
                Novo processo
              </Link>
            </Button>
          </SubscriptionAccessWrapper>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Processos</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por número de processo ou tribunal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredProcesses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredProcesses.map((process) => (
                <div 
                  key={process.id}
                  className="border rounded-lg p-4 hover:border-praxis-olive hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/judicial-processes/${process.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-praxis-olive" />
                        <h4 className="font-medium text-lg">
                          {formatProcessNumber(process.numeroProcesso)}
                        </h4>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>{process.tribunal}</span>
                        </div>
                        {process.clientId && (
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
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
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Atualizado em: {formatDate(process.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/judicial-processes/${process.id}`);
                        }}
                      >
                        <span>Ver detalhes</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p>Nenhum processo judicial encontrado.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                <SubscriptionAccessWrapper action="pesquisar um processo judicial">
                  <Button asChild variant="outline">
                    <Link to="/judicial-processes/search" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Pesquisar processo
                    </Link>
                  </Button>
                </SubscriptionAccessWrapper>
                <SubscriptionAccessWrapper action="criar um novo processo judicial">
                  <Button asChild>
                    <Link to="/judicial-processes/new" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar novo processo
                    </Link>
                  </Button>
                </SubscriptionAccessWrapper>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JudicialProcessesList;
