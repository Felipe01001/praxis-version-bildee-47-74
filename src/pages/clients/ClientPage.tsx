import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { ClientHeader } from '@/components/client/ClientHeader';
import { ClientEditForm } from '@/components/client/ClientEditForm';
import { OverviewTab } from '@/components/client/OverviewTab';
import { CasesTab } from '@/components/client/CasesTab';
import { TasksTab } from '@/components/client/TasksTab';
import { AttachmentsTab } from '@/components/client/AttachmentsTab';
import { JudicialProcessTab } from '@/components/client/JudicialProcessTab';
import { PetitionsTab } from '@/components/client/PetitionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useHoverEffect } from '@/hooks/useHoverEffect';

const ClientPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const { 
    clients, 
    cases, 
    tasks, 
    attachments,
    petitions,
    updateClient, 
    deleteClient,
    addCase,
    updateCase,
    deleteCase,
    addTask,
    updateTask,
    deleteTask,
    addAttachment,
    deleteAttachment,
    deletePetition,
    updatePetition
  } = usePraxisContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();
  
  // Effect para atualizar a aba ativa quando o parâmetro de consulta 'tab' mudar
  useEffect(() => {
    if (tabFromUrl && ['overview', 'cases', 'tasks', 'attachments', 'judicial', 'petitions'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  
  // Find client by ID
  const client = clients.find(c => c.id === clientId);
  
  // Get client-specific data
  const clientCases = cases.filter(c => c.clientId === clientId);
  const clientTasks = tasks.filter(t => t.clientId === clientId);
  const clientAttachments = attachments.filter(a => a.clientId === clientId);
  const clientPetitions = petitions ? petitions.filter(p => p.clientId === clientId) : [];
  
  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Cliente não encontrado</h2>
        <p className="text-muted-foreground mb-6">O cliente que você está procurando não existe ou foi removido.</p>
        <button 
          className="text-praxis-olive hover:underline"
          onClick={() => navigate('/clients')}
        >
          Voltar para a lista de clientes
        </button>
      </div>
    );
  }
  
  const handleDelete = () => {
    deleteClient(clientId!);
    toast.success('Cliente excluído com sucesso');
    navigate('/clients');
  };
  
  const handleUpdate = (updatedClient: typeof client) => {
    updateClient(updatedClient);
    setIsEditing(false);
    toast.success('Cliente atualizado com sucesso');
  };

  // Quando a aba muda, atualiza a URL para refletir a aba atual
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/clients/${clientId}?tab=${value}`);
  };

  if (isEditing) {
    return (
      <ClientEditForm 
        client={client}
        onSave={handleUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <ClientHeader 
        client={client}
        onDelete={handleDelete}
        onEdit={() => setIsEditing(true)}
      />
      
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-6 w-full">
          <TabsTrigger 
            value="overview"
            className="transition-colors"
            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
            onMouseLeave={handleMouseLeave}
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="cases"
            className="transition-colors"
            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
            onMouseLeave={handleMouseLeave}
          >
            Atendimento
          </TabsTrigger>
          <TabsTrigger 
            value="tasks"
            className="transition-colors"
            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
            onMouseLeave={handleMouseLeave}
          >
            Tarefas
          </TabsTrigger>
          <TabsTrigger 
            value="attachments"
            className="transition-colors"
            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
            onMouseLeave={handleMouseLeave}
          >
            Anexos
          </TabsTrigger>
          <TabsTrigger 
            value="judicial"
            className="transition-colors"
            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
            onMouseLeave={handleMouseLeave}
          >
            Processos
          </TabsTrigger>
          <TabsTrigger 
            value="petitions"
            className="transition-colors"
            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
            onMouseLeave={handleMouseLeave}
          >
            Petições
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            client={client}
            cases={cases.filter(c => c.clientId === clientId)}
            tasks={tasks.filter(t => t.clientId === clientId)}
            onTabChange={handleTabChange}
          />
        </TabsContent>
        
        <TabsContent value="cases" className="space-y-4">
          <CasesTab
            cases={cases.filter(c => c.clientId === clientId)}
            clientId={clientId!}
            clientCategory={client.category}
            addCase={addCase}
            updateCase={updateCase}
            deleteCase={deleteCase}
          />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <TasksTab
            tasks={tasks.filter(t => t.clientId === clientId)}
            clientId={clientId!}
            cases={cases.filter(c => c.clientId === clientId)}
            clients={clients}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
          />
        </TabsContent>
        
        <TabsContent value="attachments" className="space-y-4">
          <AttachmentsTab
            attachments={attachments.filter(a => a.clientId === clientId)}
            clientId={clientId!}
            addAttachment={addAttachment}
            deleteAttachment={deleteAttachment}
          />
        </TabsContent>
        
        <TabsContent value="judicial" className="space-y-4">
          <JudicialProcessTab
            clientId={clientId!}
          />
        </TabsContent>
        
        <TabsContent value="petitions" className="space-y-4">
          <PetitionsTab
            petitions={petitions || []}
            clientId={clientId!}
            deletePetition={deletePetition}
            updatePetition={updatePetition}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientPage;
