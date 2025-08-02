
import { useState } from 'react';
import { toast } from 'sonner';
import { usePraxisContext } from '@/context/PraxisContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { Category, Status, Client } from '@/types';
import { Search, UserPlus } from 'lucide-react';
import { CATEGORY_LABELS } from '@/constants';

const ClientList = () => {
  const { clients, cases } = usePraxisContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  
  const navigate = useNavigate();

  // Filter function to replace missing filterClients
  const filteredClients = clients.filter(client => {
    const categoryMatch = categoryFilter === 'all' || client.category === categoryFilter;
    
    const searchMatch = !searchTerm || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf.includes(searchTerm);
    
    // If status filter is active, check if client has any case with that status
    const statusMatch = statusFilter === 'all' || 
      cases.some(c => c.clientId === client.id && c.status === statusFilter);
    
    return categoryMatch && searchMatch && statusMatch;
  });
  
  // Function to get the most recent status of a client
  const getClientMostRecentStatus = (clientId: string) => {
    const clientCases = cases.filter(c => c.clientId === clientId);
    
    if (clientCases.length === 0) {
      return null;
    }
    
    // Sort by updatedAt date (most recent first)
    const sortedCases = [...clientCases].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    return sortedCases[0].status;
  };
  
  const handleAddClient = () => {
    navigate('/clients/new');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text">Clientes</h1>
        
        <Button onClick={handleAddClient} className="bg-praxis-olive hover:bg-praxis-olive/90 flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle>Filtrar Clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={categoryFilter} 
              onValueChange={(value) => setCategoryFilter(value as Category | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="social-security">Previdenciário</SelectItem>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="civil">Cível</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value as Status | 'all')}
            >
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
        </CardContent>
      </Card>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="py-3 px-4 text-left">Nome</th>
              <th className="py-3 px-4 text-left">CPF</th>
              <th className="py-3 px-4 text-left">Categoria</th>
              <th className="py-3 px-4 text-left">Contato</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const status = getClientMostRecentStatus(client.id);
                
                return (
                  <tr key={client.id} className="border-t hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <Link 
                        to={`/clients/${client.id}`} 
                        className="text-praxis-olive hover:underline font-medium"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{client.cpf}</td>
                    <td className="py-3 px-4">
                      {CATEGORY_LABELS[client.category as keyof typeof CATEGORY_LABELS]}
                    </td>
                    <td className="py-3 px-4">{client.phone || client.email || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      {status ? <StatusBadge status={status} /> : '-'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientList;
