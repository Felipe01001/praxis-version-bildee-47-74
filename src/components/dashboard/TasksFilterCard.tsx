
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Filter, CheckCircle, Clock, AlertCircle, FileText, Image, Paperclip, Edit, Trash2, History as HistoryIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/forms/TaskForm';
import { Task, Case, Client, Status } from '@/types';
import { STATUS_LABELS } from '@/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

interface TasksFilterCardProps {
  tasks: Task[];
  clients: Client[];
  cases: Case[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
}

export default function TasksFilterCard({ tasks, clients, cases, addTask }: TasksFilterCardProps) {
  const navigate = useNavigate();
  const { headerColor } = useTheme();
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewingTask, setIsViewingTask] = useState(false);

  const filteredTasks = tasks.filter(task => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    return statusMatch;
  });

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    await addTask(taskData);
    setIsFormOpen(false);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsViewingTask(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'analysis':
        return <FileText className="h-5 w-5 text-amber-600" />;
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getCaseName = (caseId: string | undefined) => {
    if (!caseId) return '-';
    const caseItem = cases.find(c => c.id === caseId);
    return caseItem ? caseItem.description || caseItem.subCategory : 'Atendimento não encontrado';
  };

  const sortedTasks = filteredTasks.sort((a, b) => {
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    
    const dateA = new Date(a.endDate);
    const dateB = new Date(b.endDate);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: headerColor }} />
            Tarefas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SubscriptionAccessWrapper action="criar uma nova tarefa">
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
          </SubscriptionAccessWrapper>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <TaskForm
              clients={clients}
              cases={cases}
              onSubmit={handleAddTask}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={statusFilter} onValueChange={(value: Status | 'all') => setStatusFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="in-progress">Em andamento</SelectItem>
              <SelectItem value="delayed">Atrasada</SelectItem>
              <SelectItem value="analysis">Em análise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sortedTasks.length > 0 ? (
          <div className="space-y-3">
            {sortedTasks.slice(0, 5).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                clients={clients}
                cases={cases}
                showActions={false}
                clickable={true}
                onTaskClick={handleTaskClick}
              />
            ))}
            {sortedTasks.length > 5 && (
              <div className="text-center pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/tasks')}
              >
                Ver mais {sortedTasks.length - 5} tarefas
              </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Nenhuma tarefa encontrada.
          </div>
        )}
      </CardContent>

      {/* Dialog para exibir detalhes completos da tarefa */}
      <Dialog open={isViewingTask} onOpenChange={setIsViewingTask}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              Detalhes completos da tarefa
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="py-4">
              <Tabs defaultValue="details">
                <TabsList className="mb-4 w-full grid grid-cols-3">
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="attachments">Anexos</TabsTrigger>
                  <TabsTrigger value="updates">Atualizações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Status</h4>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedTask.status)}
                        <StatusBadge status={selectedTask.status} useCustomization />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Cliente</h4>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-blue-600" 
                        onClick={() => {
                          navigate(`/clients/${selectedTask.clientId}`);
                          setIsViewingTask(false);
                        }}
                      >
                        {getClientName(selectedTask.clientId)}
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Data de início</h4>
                      <p>{formatDate(selectedTask.startDate)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Prazo</h4>
                      <p>{formatDate(selectedTask.endDate)}</p>
                    </div>
                    
                    {selectedTask.caseId && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium mb-1">Atendimento vinculado</h4>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-blue-600" 
                          onClick={() => {
                            navigate(`/cases/${selectedTask.caseId}/timeline`);
                            setIsViewingTask(false);
                          }}
                        >
                          {getCaseName(selectedTask.caseId)}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {selectedTask.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Descrição</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedTask.description}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="attachments">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Anexos da tarefa</h4>
                    {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTask.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-2">
                              {attachment.type === 'image' && <Image className="h-4 w-4" />}
                              {attachment.type === 'link' && <Paperclip className="h-4 w-4" />}
                              {attachment.type === 'document' && <FileText className="h-4 w-4" />}
                              <span>{attachment.name}</span>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                Abrir
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border rounded-md">
                        <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhum anexo adicionado a esta tarefa</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="updates">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Histórico de atualizações</h4>
                    {selectedTask.updates && selectedTask.updates.length > 0 ? (
                      <div className="border rounded-md divide-y">
                        {selectedTask.updates.map((update) => (
                          <div key={update.id} className="p-3">
                            <div className="flex flex-wrap justify-between gap-2 text-sm">
                              <span className="font-medium">{update.userName || 'Usuário'}</span>
                              <span className="text-muted-foreground">{formatDate(update.date)}</span>
                            </div>
                            <p className="mt-2 text-sm whitespace-pre-wrap">{update.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border rounded-md">
                        <HistoryIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhuma atualização registrada para esta tarefa</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewingTask(false)}>
              Fechar
            </Button>
            <Button onClick={() => navigate('/tasks')}>
              <Edit className="mr-2 h-4 w-4" />
              Ir para Tarefas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
