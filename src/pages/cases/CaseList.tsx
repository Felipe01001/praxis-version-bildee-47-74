
import { useState } from 'react';
import { usePraxisContext } from '@/context/PraxisContext';
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
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORY_LABELS, SUBCATEGORIES } from '@/constants';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';

const CaseList = () => {
  const { cases, clients } = usePraxisContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCases = cases.filter(caseItem => {
    const client = clients.find(c => c.id === caseItem.clientId);
    
    // Apply search filter
    const matchesSearch = 
      !searchTerm || 
      (client && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (caseItem.description && caseItem.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply category filter
    const matchesCategory = categoryFilter === 'all' || caseItem.category === categoryFilter;
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text">Processos</h1>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle>Filtrar Processos</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={categoryFilter} 
              onValueChange={setCategoryFilter}
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
              onValueChange={setStatusFilter}
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
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Cliente</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Subcategoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Atualização</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.length > 0 ? (
              filteredCases.map((caseItem) => {
                const subcategoryLabel = SUBCATEGORIES[caseItem.category]?.find(
                  s => s.value === caseItem.subCategory
                )?.label || caseItem.subCategory;
                
                return (
                  <TableRow key={caseItem.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link 
                        to={`/clients/${caseItem.clientId}`} 
                        className="text-green-700 hover:underline font-medium"
                      >
                        {getClientName(caseItem.clientId)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {CATEGORY_LABELS[caseItem.category as keyof typeof CATEGORY_LABELS]}
                    </TableCell>
                    <TableCell>{subcategoryLabel || 'N/A'}</TableCell>
                    <TableCell>{caseItem.description || 'N/A'}</TableCell>
                    <TableCell>
                      <StatusBadge status={caseItem.status} />
                    </TableCell>
                    <TableCell>
                      {formatDate(caseItem.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum processo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CaseList;
