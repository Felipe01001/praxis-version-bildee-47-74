
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Clock, Check } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { CaseTimeline } from '@/components/case/CaseTimeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Status, CaseTimelineItem, TimelineItemType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const CaseDetailPage = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { 
    cases, 
    clients, 
    tasks,
    attachments,
    updateCase,
    addTask 
  } = usePraxisContext();
  
  const [activeTab, setActiveTab] = useState('timeline');
  const [timelineItems, setTimelineItems] = useState<CaseTimelineItem[]>([]);
  
  // Find case by ID
  const caseItem = cases.find(c => c.id === caseId);
  
  // Get related data
  const client = caseItem ? clients.find(c => c.id === caseItem.clientId) : null;
  const caseTasks = tasks.filter(t => t.caseId === caseId);
  const caseAttachments = attachments.filter(a => a.caseId === caseId);
  
  // For demo purposes, create some timeline items if none exist
  useEffect(() => {
    if (caseItem && timelineItems.length === 0) {
      // Create initial creation item
      const initialItems: CaseTimelineItem[] = [
        {
          id: uuidv4(),
          caseId: caseId!,
          type: 'update' as TimelineItemType, // Changed from 'note' to 'update'
          title: 'Atendimento iniciado',
          description: `Atendimento iniciado para ${client?.name || 'Cliente'}`,
          date: caseItem.createdAt
        }
      ];
      
      setTimelineItems(initialItems);
    }
  }, [caseItem, client, caseId, timelineItems.length]);
  
  if (!caseItem || !client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Atendimento não encontrado</h2>
        <p className="text-muted-foreground mb-6">O atendimento que você está procurando não existe ou foi removido.</p>
        <Button 
          variant="outline"
          onClick={() => navigate('/cases')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista de atendimentos
        </Button>
      </div>
    );
  }
  
  const handleStatusChange = (status: Status) => {
    const updatedCase = { ...caseItem, status };
    
    // If status is completed, add end date
    if (status === 'completed' && !caseItem.endDate) {
      updatedCase.endDate = new Date().toISOString();
      
      // Add a timeline item for case completion
      handleAddTimelineItem({
        caseId: caseId!,
        type: 'update' as TimelineItemType,
        title: 'Atendimento concluído',
        description: 'Este atendimento foi marcado como concluído.',
        date: new Date().toISOString()
      });
    }
    
    updateCase(updatedCase);
    toast.success('Status do atendimento atualizado com sucesso');
  };
  
  const handleAddTimelineItem = (item: Omit<CaseTimelineItem, 'id'>) => {
    const newItem: CaseTimelineItem = {
      ...item,
      id: uuidv4()
    };
    
    setTimelineItems(current => [...current, newItem]);
    // In a real application, you would save this to your database
  };
  
  const createdAt = new Date(caseItem.createdAt).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const completedAt = caseItem.endDate 
    ? new Date(caseItem.endDate).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate('/cases')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a lista de atendimentos
      </Button>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text">
              Atendimento #{caseItem.id.slice(0, 8)}
            </h1>
            <StatusBadge status={caseItem.status} />
          </div>
          <p className="text-muted-foreground">
            {caseItem.description || 'Sem descrição'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={caseItem.status}
            onValueChange={(value) => handleStatusChange(value as Status)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="analysis">Analisando</SelectItem>
              <SelectItem value="in-progress">Em Andamento</SelectItem>
              <SelectItem value="delayed">Tramitando</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-praxis-olive" />
              <Button variant="link" asChild className="p-0 h-auto">
                <Link to={`/clients/${client.id}`}>{client.name}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data de Início</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-praxis-olive" />
              <span>{createdAt}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {caseItem.status === 'completed' ? 'Data de Conclusão' : 'Tarefas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseItem.status === 'completed' && completedAt ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>{completedAt}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{caseTasks.length}</span>
                <span className="text-muted-foreground">tarefas associadas</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Content tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="attachments">Anexos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="space-y-4">
          <CaseTimeline
            caseId={caseId!}
            timelineItems={timelineItems}
            onAddItem={handleAddTimelineItem}
            tasks={caseTasks}
            attachments={caseAttachments}
          />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tarefas</CardTitle>
              <Button>Nova Tarefa</Button>
            </CardHeader>
            <CardContent>
              {caseTasks.length > 0 ? (
                <div>
                  {/* Task list would go here */}
                  <p>Lista de tarefas associadas a este atendimento.</p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhuma tarefa encontrada.</p>
                  <p className="text-sm mt-2">Adicione tarefas para acompanhar o progresso do atendimento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Anexos</CardTitle>
              <Button>Adicionar Anexo</Button>
            </CardHeader>
            <CardContent>
              {caseAttachments.length > 0 ? (
                <div>
                  {/* Attachments list would go here */}
                  <p>Lista de anexos associados a este atendimento.</p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum anexo encontrado.</p>
                  <p className="text-sm mt-2">Adicione documentos para organizar este atendimento.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaseDetailPage;

// Helper component for inline links
const Link = ({ to, children, ...props }: { to: string; children: React.ReactNode } & React.HTMLProps<HTMLAnchorElement>) => {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };
  
  return (
    <a 
      href={to} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
};
