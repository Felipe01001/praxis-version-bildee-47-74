
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { Status, Category } from '@/types';
import { CATEGORY_LABELS } from '@/constants';
import { MessageSquare, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useHoverEffect } from '@/hooks/useHoverEffect';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

interface CasesFilterCardProps {
  filteredCases: any[];
  statusFilter: Status | 'all';
  setStatusFilter: (status: Status | 'all') => void;
  clients: any[];
}

const CasesFilterCard = ({
  filteredCases,
  statusFilter,
  setStatusFilter,
  clients
}: CasesFilterCardProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { headerColor } = useTheme();
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();

  // Sort cases by most recent update date
  const sortedCases = [...filteredCases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5); // Limit to 5 cases

  // Check if the screen is in the medium size range (not mobile, but not full desktop)
  const isMediumScreen = !isMobile && window.innerWidth < 1024;

  const handleCaseClick = (caseItem: any) => {
    navigate(`/clients/${caseItem.clientId}?tab=cases`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-praxis-olive" />
            Atendimentos
          </CardTitle>
          <SubscriptionAccessWrapper action="criar um novo atendimento">
            <Button variant="default" size={isMobile ? "sm" : "default"} asChild className={isMobile ? "px-2 min-w-0" : "px-3 min-w-0"}>
              <Link to="/clients">
                <Plus className="h-4 w-4" />
                {isMediumScreen && <span className="ml-1">Novo Atendimento</span>}
              </Link>
            </Button>
          </SubscriptionAccessWrapper>
        </div>
      </CardHeader>
      <CardContent className="px-[7px]">
        {/* Área de busca e filtros lado a lado no desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Área de busca por número de processo */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Buscar por nome ou CPF..." className="pl-10" onChange={e => {
            // Searching logic is handled in the parent component
            const customEvent = new CustomEvent('searchProcess', {
              detail: {
                value: e.target.value
              }
            });
            window.dispatchEvent(customEvent);
          }} />
          </div>
          
          {/* Área de filtros de status - Seleção dropdown */}
          <div>
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as Status | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="analysis">Em análise</SelectItem>
                <SelectItem value="in-progress">Em tramitação</SelectItem>
                <SelectItem value="delayed">Atrasado</SelectItem>
                <SelectItem value="completed">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Lista de casos - Transformada em tabela */}
        <div className="space-y-4">
          {sortedCases.length > 0 ? (
            <div>
              {/* Área com altura fixa para 5 itens e barra de rolagem quando necessário */}
              <ScrollArea className="h-[300px]">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Cliente</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCases.map(caseItem => {
                        const client = clients.find(c => c.id === caseItem.clientId);
                        return (
                          <TableRow 
                            key={caseItem.id} 
                            className="cursor-pointer transition-colors duration-200"
                            onMouseEnter={(e) => handleMouseEnter(e, 0.6)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleCaseClick(caseItem)}
                          >
                            <TableCell>
                              <span className="font-medium text-green-700">
                                {client?.name}
                              </span>
                              {caseItem.caseNumber && (
                                <div className="text-xs text-muted-foreground">
                                  #{caseItem.caseNumber}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {CATEGORY_LABELS[caseItem.category as keyof typeof CATEGORY_LABELS]}
                            </TableCell>
                            <TableCell className="px-0 mx-0 text-center">
                              <StatusBadge status={caseItem.status} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
              
              {filteredCases.length > 5 && (
                <div className="mt-4">
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/cases">Ver todos os atendimentos</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum atendimento encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CasesFilterCard;
