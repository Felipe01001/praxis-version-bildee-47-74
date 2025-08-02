
import { useState, useEffect } from 'react';
import { usePraxisContext } from '@/context/PraxisContext';
import { Category, Status } from '@/types';

// Importing the refactored components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatCards from '@/components/dashboard/DashboardStatCards';
import CasesStatusCard from '@/components/dashboard/CasesStatusCard';
import ClientsFilterCard from '@/components/dashboard/ClientsFilterCard';
import CasesFilterCard from '@/components/dashboard/CasesFilterCard';
import TasksFilterCard from '@/components/dashboard/TasksFilterCard';
import JudicialProcessesCard from '@/components/dashboard/JudicialProcessesCard';
import PetitionsCard from '@/components/dashboard/PetitionsCard';

// Types for filters
type CategoryFilter = Category | 'all';
type StatusFilter = Status | 'all';

const Dashboard = () => {
  const { clients = [], cases = [], tasks = [], judicialProcesses = [], petitions = [], addTask } = usePraxisContext();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processNumberSearch, setProcessNumberSearch] = useState('');
  const [filteredClients, setFilteredClients] = useState(clients || []);
  const [filteredCases, setFilteredCases] = useState(cases || []);
  
  // Event listener for process number search
  useEffect(() => {
    const handleProcessSearch = (event: any) => {
      setProcessNumberSearch(event.detail.value);
    };
    
    window.addEventListener('searchProcess', handleProcessSearch);
    
    return () => {
      window.removeEventListener('searchProcess', handleProcessSearch);
    };
  }, []);
  
  useEffect(() => {
    // Ensure we have arrays to work with before filtering
    const safeClients = clients || [];
    const safeCases = cases || [];
    
    // Filtrar clientes com base na categoria selecionada e termo de busca
    const clientsFiltered = safeClients.filter(client => {
      // Verificar se corresponde ao filtro de categoria
      const categoryMatch = categoryFilter === 'all' || client.category === categoryFilter;
      
      // Verificar se corresponde ao termo de busca
      const searchMatch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf.includes(searchTerm);
      
      return categoryMatch && searchMatch;
    });
    
    setFilteredClients(clientsFiltered);
    
    // Filtrar casos com base no status, na categoria do cliente e no número do processo
    const casesFiltered = safeCases.filter(caseItem => {
      // Verifica se o caso corresponde ao filtro de status
      const statusMatch = statusFilter === 'all' || caseItem.status === statusFilter;
      
      // Verifica se o caso pertence a um cliente que corresponde ao filtro de categoria
      const client = safeClients.find(c => c.id === caseItem.clientId);
      const categoryMatch = categoryFilter === 'all' || (client && client.category === categoryFilter);
      
      // Verificar se corresponde ao termo de busca geral
      const searchMatch = !searchTerm || 
        (caseItem.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client && client.cpf.includes(searchTerm));
      
      // Verificar se corresponde ao número do processo
      // Use processNumber property which might be part of the id or description
      const processNumberMatch = !processNumberSearch || 
        (caseItem.id && caseItem.id.includes(processNumberSearch)) ||
        (caseItem.description && caseItem.description.includes(processNumberSearch));
      
      return statusMatch && categoryMatch && searchMatch && processNumberMatch;
    });
    
    setFilteredCases(casesFiltered);
  }, [categoryFilter, statusFilter, searchTerm, processNumberSearch, clients, cases]);
  
  // Totais para estatísticas
  const totalClients = clients?.length || 0;
  const totalCases = cases?.length || 0;
  const totalTasks = tasks?.length || 0;
  const totalJudicialProcesses = judicialProcesses?.length || 0;
  
  // Status dos casos
  const completedCases = cases?.filter(c => c.status === 'completed').length || 0;
  const inProgressCases = cases?.filter(c => c.status === 'in-progress').length || 0;
  const delayedCases = cases?.filter(c => c.status === 'delayed').length || 0;
  const analysisCases = cases?.filter(c => c.status === 'analysis').length || 0;

  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      <DashboardStatCards 
        totalClients={totalClients}
        totalCases={totalCases}
        totalTasks={totalTasks}
        totalJudicialProcesses={totalJudicialProcesses}
      />
      
      {/* Status dos processos - Movido para cima, abaixo dos stat cards */}
      <CasesStatusCard 
        completedCases={completedCases}
        inProgressCases={inProgressCases}
        delayedCases={delayedCases}
        analysisCases={analysisCases}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clientes - Ocupando 1/2 do espaço na versão desktop */}
        <div className="lg:col-span-1">
          <ClientsFilterCard
            filteredClients={filteredClients}
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            setSearchTerm={setSearchTerm}
            setCategoryFilter={setCategoryFilter}
          />
        </div>
        
        {/* Atendimentos - Ocupando 1/2 do espaço na versão desktop */}
        <div className="lg:col-span-1">
          <CasesFilterCard
            filteredCases={filteredCases}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            clients={clients || []}
          />
        </div>
        
        {/* Tarefas - Ocupando metade da largura total */}
        <div className="lg:col-span-2 xl:col-span-1">
          <TasksFilterCard 
            tasks={tasks || []}
            clients={clients || []}
            cases={cases || []}
            addTask={addTask}
          />
        </div>
        
        {/* Processos Judiciais - Ocupando metade da largura total */}
        <div className="lg:col-span-2 xl:col-span-1">
          <JudicialProcessesCard judicialProcesses={judicialProcesses || []} />
        </div>
        
        {/* Petições - Nova seção abaixo dos processos */}
        <div className="lg:col-span-2">
          <PetitionsCard petitions={petitions || []} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
