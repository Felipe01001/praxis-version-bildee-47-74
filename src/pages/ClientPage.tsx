
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { ClientHeader } from '@/components/client/ClientHeader';
import { OverviewTab } from '@/components/client/OverviewTab';
import { CasesTab } from '@/components/client/CasesTab';
import { TasksTab } from '@/components/client/TasksTab';
import { AttachmentsTab } from '@/components/client/AttachmentsTab';
import { JudicialProcessTab } from '@/components/client/JudicialProcessTab';
import { PetitionsTab } from '@/components/client/PetitionsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const ClientPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { 
    clients, 
    cases, 
    tasks, 
    attachments,
    petitions,
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
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Find client by ID
  const client = clients.find(c => c.id === clientId);
  
  // Get client-specific data
  const clientCases = cases.filter(c => c.clientId === clientId);
  const clientTasks = tasks.filter(t => t.clientId === clientId);
  const clientAttachments = attachments.filter(a => a.clientId === clientId);
  
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
  
  return (
    <div className="space-y-6">
      <ClientHeader 
        client={client}
        onDelete={handleDelete}
      />
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-6 w-full">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cases">Atendimento</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="attachments">Anexos</TabsTrigger>
          <TabsTrigger value="judicial">Processos Judiciais</TabsTrigger>
          <TabsTrigger value="petitions">Petições</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            client={client}
            cases={clientCases}
            tasks={clientTasks}
            onTabChange={setActiveTab}
          />
        </TabsContent>
        
        <TabsContent value="cases" className="space-y-4">
          <CasesTab
            cases={clientCases}
            clientId={clientId!}
            clientCategory={client.category}
            addCase={addCase}
            updateCase={updateCase}
            deleteCase={deleteCase}
          />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <TasksTab
            tasks={clientTasks}
            clientId={clientId!}
            cases={clientCases}
            clients={clients}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
          />
        </TabsContent>
        
        <TabsContent value="attachments" className="space-y-4">
          <AttachmentsTab
            attachments={clientAttachments}
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
            petitions={petitions}
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
