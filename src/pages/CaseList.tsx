
import { useState, useEffect } from 'react';
import { usePraxisContext } from '@/context/PraxisContext';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from '@/components/StatusBadge';
import { Category, Status } from '@/types';
import { CATEGORY_LABELS, SUBCATEGORIES } from '@/constants';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

const CaseList = () => {
  const {
    cases,
    clients
  } = usePraxisContext();
  const {
    headerColor
  } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Check if there's a status filter from navigation state (from dashboard)
  useEffect(() => {
    if (location.state?.statusFilter) {
      setStatusFilter(location.state.statusFilter);
    }
  }, [location.state]);

  // Filter cases based on filters
  const filteredCases = cases.filter(caseItem => {
    // Category filter
    const categoryMatch = categoryFilter === 'all' || caseItem.category === categoryFilter;

    // Status filter
    const statusMatch = statusFilter === 'all' || caseItem.status === statusFilter;

    // Search by description, case number or client name
    const client = clients.find(c => c.id === caseItem.clientId);
    const clientName = client?.name?.toLowerCase() || '';
    const searchMatch = !searchTerm || (caseItem.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (caseItem.id.slice(0, 8) || '').includes(searchTerm) || clientName.includes(searchTerm.toLowerCase());
    return categoryMatch && statusMatch && searchMatch;
  });

  // Sort cases by most recent first
  const sortedCases = [...filteredCases].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleViewCase = (caseItem: any) => {
    // Navigate to client profile with cases tab selected
    navigate(`/clients/${caseItem.clientId}?tab=cases`);
  };

  const handleCreateCase = () => {
    navigate('/cases/new');
  };

  // Function to get client name from clientId
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  // Function to get subcategory label
  const getSubcategoryLabel = (category: Category, subCategory: string) => {
    const subcategoryItem = SUBCATEGORIES[category]?.find(item => item.value === subCategory);
    return subcategoryItem ? subcategoryItem.label : subCategory;
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="sm:text-3xl font-bold text-praxis-text text-4xl text-center">Atendimentos</h1>
        
        <SubscriptionAccessWrapper action="criar um novo atendimento">
          <Button onClick={handleCreateCase} className="bg-praxis-olive hover:bg-praxis-olive/90 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Atendimento
          </Button>
        </SubscriptionAccessWrapper>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle>Filtrar Atendimentos</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar por cliente, número..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={categoryFilter} onValueChange={value => setCategoryFilter(value as Category | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="social-security">Previdenciário</SelectItem>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="civil">Cível</SelectItem>
              </SelectContent>
            </Select>
            
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
        </CardContent>
      </Card>
      
      {/* Mobile/Tablet responsive cards */}
      <div className="block lg:hidden space-y-4">
        {sortedCases.length > 0 ? (
          sortedCases.map(caseItem => (
            <Card 
              key={caseItem.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: hoveredRowId === caseItem.id ? `${headerColor}66` : 'transparent'
              }}
              onMouseEnter={() => setHoveredRowId(caseItem.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              onClick={() => handleViewCase(caseItem)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-praxis-olive">
                      {getClientName(caseItem.clientId)}
                    </h3>
                    <StatusBadge status={caseItem.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Categoria:</span>
                      <p className="font-medium">
                        {CATEGORY_LABELS[caseItem.category as keyof typeof CATEGORY_LABELS]}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subcategoria:</span>
                      <p className="font-medium">
                        {getSubcategoryLabel(caseItem.category, caseItem.subCategory)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground text-sm">Descrição:</span>
                    <p className="text-sm mt-1">
                      {caseItem.description || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-muted-foreground/50" />
                <span>Nenhum atendimento encontrado.</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop table */}
      <Card className="overflow-hidden hidden lg:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="py-4 px-3 text-left font-semibold text-muted-foreground min-w-[200px]">Cliente</th>
                <th className="py-4 px-3 text-left font-semibold text-muted-foreground min-w-[150px]">Categoria</th>
                <th className="py-4 px-3 text-left font-semibold text-muted-foreground min-w-[150px]">Subcategoria</th>
                <th className="py-4 px-3 text-left font-semibold text-muted-foreground min-w-[200px]">Descrição</th>
                <th className="py-4 px-3 text-center font-semibold text-muted-foreground min-w-[120px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedCases.length > 0 ? sortedCases.map(caseItem => (
                <tr 
                  key={caseItem.id} 
                  className="border-b cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: hoveredRowId === caseItem.id ? `${headerColor}66` : 'transparent'
                  }}
                  onMouseEnter={() => setHoveredRowId(caseItem.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  onClick={() => handleViewCase(caseItem)}
                >
                  <td className="py-4 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-praxis-olive">
                        {getClientName(caseItem.clientId)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-sm font-medium">
                      {CATEGORY_LABELS[caseItem.category as keyof typeof CATEGORY_LABELS]}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-sm text-muted-foreground">
                      {getSubcategoryLabel(caseItem.category, caseItem.subCategory)}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-sm text-muted-foreground" title={caseItem.description || 'N/A'}>
                      {caseItem.description || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <StatusBadge status={caseItem.status} />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <span>Nenhum atendimento encontrado.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default CaseList;
