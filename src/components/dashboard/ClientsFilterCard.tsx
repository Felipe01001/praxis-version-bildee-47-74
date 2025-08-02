
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category, Status } from '@/types';
import { CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS } from '@/constants';
import { UserRound, UserPlus } from 'lucide-react';
import { usePraxisContext } from '@/context/PraxisContext';
import { useTheme } from '@/context/ThemeContext';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { ClientStatusBadge } from '@/components/client/ClientStatusBadge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHoverEffect } from '@/hooks/useHoverEffect';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

interface ClientsFilterCardProps {
  filteredClients: any[];
  searchTerm: string;
  categoryFilter: Category | 'all';
  setSearchTerm: (term: string) => void;
  setCategoryFilter: (category: Category | 'all') => void;
}

const ClientsFilterCard = ({
  filteredClients,
  searchTerm,
  categoryFilter,
  setCategoryFilter,
  setSearchTerm
}: ClientsFilterCardProps) => {
  const { cases } = usePraxisContext();
  const { headerColor } = useTheme();
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();
  const navigate = useNavigate();

  // Function to get the most recent status of a client
  const getClientMostRecentStatus = (clientId: string) => {
    const clientCases = cases.filter(c => c.clientId === clientId);
    if (clientCases.length === 0) {
      return null;
    }

    // Sort by updatedAt date (most recent first)
    const sortedCases = [...clientCases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sortedCases[0].status;
  };

  // Sort clients by most recently updated first
  const sortedClients = [...filteredClients].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-praxis-olive" />
            Clientes
          </div>
          <SubscriptionAccessWrapper action="criar um novo cliente">
            <Button asChild size="sm" className="bg-praxis-olive hover:bg-praxis-olive/90">
              <Link to="/clients/new" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Novo Cliente</span>
              </Link>
            </Button>
          </SubscriptionAccessWrapper>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-[7px]">
        {/* Área de busca e filtros - Modified to remove the status filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Busca" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          
          <Select value={categoryFilter} onValueChange={value => setCategoryFilter(value as Category | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="social-security">Previdenciário</SelectItem>
              <SelectItem value="criminal">Criminal</SelectItem>
              <SelectItem value="civil">Cível</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          {sortedClients.length > 0 ? (
            <>
              {/* Fixed height area with scrolling */}
              <ScrollArea className="h-[300px]">
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedClients.map(client => (
                        <TableRow 
                          key={client.id} 
                          className="cursor-pointer transition-colors duration-200"
                          onMouseEnter={(e) => handleMouseEnter(e, 0.6)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleClientClick(client.id)}
                        >
                          <TableCell className="font-medium text-green-700">
                            {client.name}
                          </TableCell>
                          <TableCell>{CATEGORY_LABELS[client.category as keyof typeof CATEGORY_LABELS]}</TableCell>
                          <TableCell className="px-0">
                            <ClientStatusBadge status={client.status || 'active'} size="sm" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
              
              {/* Botão "Ver todos os clientes" */}
              <div className="mt-4">
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/clients">Ver todos os clientes</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientsFilterCard;
