
import { useState, useEffect } from 'react';
import { usePraxisContext } from '@/context/PraxisContext';
import { useTheme } from '@/context/ThemeContext';
import { useHoverEffect } from '@/hooks/useHoverEffect';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Search as SearchIcon } from 'lucide-react';
import { CATEGORY_LABELS, SUBCATEGORIES } from '@/constants';
import { Category, Status } from '@/types';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

const Search = () => {
  const { clients, cases, tasks } = usePraxisContext();
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('clients');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [results, setResults] = useState({
    clients: [] as any[],
    cases: [] as any[],
    tasks: [] as any[]
  });
  
  // Function to replace missing filterClients
  const filterClients = (searchText: string, category?: Category, status?: Status) => {
    return clients.filter(client => {
      const categoryMatch = !category || client.category === category;
      
      const searchMatch = !searchText || 
        client.name.toLowerCase().includes(searchText.toLowerCase()) ||
        client.cpf.includes(searchText);
      
      // If status filter is active, check if client has any case with that status
      const statusMatch = !status || 
        cases.some(c => c.clientId === client.id && c.status === status);
      
      return categoryMatch && searchMatch && statusMatch;
    });
  };
  
  const handleSearch = () => {
    // Filter clients
    const filteredClients = filterClients(
      searchTerm, 
      categoryFilter === 'all' ? undefined : categoryFilter, 
      statusFilter === 'all' ? undefined : statusFilter
    );
    
    // Filter cases
    const filteredCases = cases.filter(caseItem => {
      const client = clients.find(c => c.id === caseItem.clientId);
      const matchesSearch = 
        !searchTerm || 
        (client && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (caseItem.description && caseItem.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesCategory = categoryFilter === 'all' || caseItem.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Filter tasks
    const filteredTasks = tasks.filter(task => {
      const client = clients.find(c => c.id === task.clientId);
      const matchesSearch = 
        !searchTerm || 
        (client && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setResults({
      clients: filteredClients,
      cases: filteredCases,
      tasks: filteredTasks
    });
  };
  
  // Auto-search when filters change
  useEffect(() => {
    handleSearch();
  }, [searchTerm, categoryFilter, statusFilter, activeTab]);
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleCaseClick = (caseItem: any) => {
    navigate(`/clients/${caseItem.clientId}?tab=cases`);
  };

  const handleTaskClick = (task: any) => {
    navigate(`/clients/${task.clientId}?tab=tasks`);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text">Pesquisa</h1>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle>Filtros de Pesquisa</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar por nome, CPF, descrição..."
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
            
            <SubscriptionAccessWrapper action="pesquisar">
              <Button onClick={handleSearch}>
                <SearchIcon className="h-4 w-4 mr-2" />
                Pesquisar
              </Button>
            </SubscriptionAccessWrapper>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Resultados da Pesquisa</CardTitle>
              <TabsList>
                <TabsTrigger value="clients">
                  Clientes ({results.clients.length})
                </TabsTrigger>
                <TabsTrigger value="cases">
                  Atendimentos ({results.cases.length})
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  Tarefas ({results.tasks.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="clients" className="mt-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="py-3 px-4 text-left">Nome</th>
                      <th className="py-3 px-4 text-left">CPF</th>
                      <th className="py-3 px-4 text-left">Categoria</th>
                      <th className="py-3 px-4 text-left">Contato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.clients.length > 0 ? (
                      results.clients.map((client) => (
                        <tr 
                          key={client.id} 
                          className="border-t cursor-pointer transition-all duration-200"
                          onClick={() => handleClientClick(client.id)}
                          onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <td className="py-3 px-4">
                            <span className="text-praxis-olive font-medium">
                              {client.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">{client.cpf}</td>
                          <td className="py-3 px-4">
                            {CATEGORY_LABELS[client.category as keyof typeof CATEGORY_LABELS]}
                          </td>
                          <td className="py-3 px-4">{client.phone || client.email || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="cases" className="mt-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="py-3 px-4 text-left">Cliente</th>
                      <th className="py-3 px-4 text-left">Categoria</th>
                      <th className="py-3 px-4 text-left">Descrição</th>
                      <th className="py-3 px-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.cases.length > 0 ? (
                      results.cases.map((caseItem) => {
                        const subcategoryLabel = SUBCATEGORIES[caseItem.category]?.find(
                          s => s.value === caseItem.subCategory
                        )?.label || caseItem.subCategory;
                        
                        return (
                          <tr 
                            key={caseItem.id} 
                            className="border-t cursor-pointer transition-all duration-200"
                            onClick={() => handleCaseClick(caseItem)}
                            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <td className="py-3 px-4">
                              <span className="text-praxis-olive">
                                {getClientName(caseItem.clientId)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {CATEGORY_LABELS[caseItem.category as keyof typeof CATEGORY_LABELS]}
                              {subcategoryLabel ? ` - ${subcategoryLabel}` : ''}
                            </td>
                            <td className="py-3 px-4">{caseItem.description || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <StatusBadge status={caseItem.status} />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          Nenhum processo encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="tasks" className="mt-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="py-3 px-4 text-left">Cliente</th>
                      <th className="py-3 px-4 text-left">Título</th>
                      <th className="py-3 px-4 text-left">Término</th>
                      <th className="py-3 px-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.tasks.length > 0 ? (
                      results.tasks.map((task) => (
                        <tr 
                          key={task.id} 
                          className="border-t cursor-pointer transition-all duration-200"
                          onClick={() => handleTaskClick(task)}
                          onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <td className="py-3 px-4">
                            <span className="text-praxis-olive">
                              {getClientName(task.clientId)}
                            </span>
                          </td>
                          <td className="py-3 px-4">{task.title}</td>
                          <td className="py-3 px-4">{formatDate(task.endDate)}</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={task.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          Nenhuma tarefa encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Search;
