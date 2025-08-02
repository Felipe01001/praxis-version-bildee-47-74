import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { Task, Status, Client, TaskUpdate, TaskAttachment } from '@/types';
import { format } from 'date-fns';
import { ptBR } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { TaskCard } from '@/components/tasks/TaskCard';
import { FileUploadInput } from '@/components/tasks/FileUploadInput';
import { TaskUpdateSection } from '@/components/tasks/TaskUpdateSection';
import { CheckCircle, Clock, AlertCircle, FileText, Calendar, Plus, Search, User, X, FilterIcon, SlidersHorizontal, Paperclip, Image, Edit, Trash2, LayoutGrid, LayoutList, History as HistoryIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from '@/context/ThemeContext';
import { useHoverEffect } from '@/hooks/useHoverEffect';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

const Tasks = () => {
  const navigate = useNavigate();
  const { headerColor } = useTheme();
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();
  const {
    tasks,
    clients,
    cases,
    addTask,
    deleteTask,
    updateTask
  } = usePraxisContext();

  // State for task operations
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isViewingTask, setIsViewingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    clientId: '',
    caseId: '',
    startDate: '',
    endDate: '',
    status: 'analysis' as Status,
    attachments: [] as TaskAttachment[],
    updates: [] as TaskUpdate[]
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dueSoonFilter, setDueSoonFilter] = useState<boolean>(false);

  const filteredTasks = tasks.filter(task => {
    const now = new Date();
    const deadline = new Date(task.endDate);
    const daysDiff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isDueSoon = daysDiff <= 3 && daysDiff >= 0;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesClient = clientFilter === 'all' || task.clientId === clientFilter;
    const matchesDueSoon = !dueSoonFilter || isDueSoon;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesClient && matchesSearch && matchesDueSoon;
  });

  // Sort tasks by most recent end date first
  const sortedTasks = [...filteredTasks].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  const handleAddTask = () => {
    if (!newTask.title || !newTask.startDate || !newTask.endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    const taskData: any = {
      title: newTask.title,
      description: newTask.description,
      clientId: newTask.clientId,
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      status: newTask.status,
      attachments: newTask.attachments,
      updates: newTask.updates
    };

    // Only include caseId if it's not empty
    if (newTask.caseId && newTask.caseId !== '' && newTask.caseId !== 'none') {
      taskData.caseId = newTask.caseId;
    }

    addTask(taskData);
    resetTaskForm();
    setIsAddingTask(false);
    toast.success('Tarefa adicionada com sucesso');
  };

  const handleUpdateTask = () => {
    if (!selectedTask || !newTask.title || !newTask.startDate || !newTask.endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    const taskData: any = {
      ...selectedTask,
      title: newTask.title,
      description: newTask.description,
      clientId: newTask.clientId,
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      status: newTask.status,
      attachments: newTask.attachments,
      updates: newTask.updates
    };

    // Only include caseId if it's not empty
    if (newTask.caseId && newTask.caseId !== '' && newTask.caseId !== 'none') {
      taskData.caseId = newTask.caseId;
    } else {
      // Remove caseId if it's empty
      delete taskData.caseId;
    }

    updateTask(selectedTask.id, taskData);
    resetTaskForm();
    setIsEditingTask(false);
    toast.success('Tarefa atualizada com sucesso');
  };

  const confirmDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const handleDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
      setTaskToDelete(null);
      if (selectedTask?.id === taskToDelete) {
        setIsViewingTask(false);
        setSelectedTask(null);
      }
      toast.success('Tarefa excluída com sucesso');
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsViewingTask(true);
  };

  const handleEditTask = () => {
    if (selectedTask) {
      setNewTask({
        title: selectedTask.title,
        description: selectedTask.description || '',
        clientId: selectedTask.clientId,
        caseId: selectedTask.caseId || '',
        startDate: selectedTask.startDate,
        endDate: selectedTask.endDate,
        status: selectedTask.status,
        attachments: selectedTask.attachments || [],
        updates: selectedTask.updates || []
      });
      setIsEditingTask(true);
      setIsViewingTask(false);
    }
  };

  const handleAddAttachment = (attachment: TaskAttachment) => {
    setNewTask({
      ...newTask,
      attachments: [...newTask.attachments, attachment]
    });
  };

  const handleRemoveAttachment = (index: number) => {
    const updatedAttachments = [...newTask.attachments];
    updatedAttachments.splice(index, 1);
    setNewTask({
      ...newTask,
      attachments: updatedAttachments
    });
    toast.success('Anexo removido');
  };

  const handleAddUpdate = (update: TaskUpdate) => {
    setNewTask({
      ...newTask,
      updates: [update, ...newTask.updates]
    });
  };

  const resetTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      clientId: '',
      caseId: '',
      startDate: '',
      endDate: '',
      status: 'analysis',
      attachments: [],
      updates: []
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', {
        locale: ptBR
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getClientCases = (clientId: string) => {
    return cases.filter(c => c.clientId === clientId);
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

  // Calculate if a task is close to deadline (3 days or less)
  const isCloseToDueDateOrOverdue = (task: Task) => {
    const now = new Date();
    const deadline = new Date(task.endDate);
    const daysDiff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 3;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciamento de Tarefas</h1>
        <SubscriptionAccessWrapper action="criar uma nova tarefa">
          <Button onClick={() => {
            setIsAddingTask(true);
            resetTaskForm();
          }}>
            <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
          </Button>
        </SubscriptionAccessWrapper>
      </div>
      
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros e Busca</CardTitle>
          <CardDescription>
            Filtre e busque tarefas específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as Status | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="analysis">Em análise</SelectItem>
                  <SelectItem value="in-progress">Em tramitação</SelectItem>
                  <SelectItem value="delayed">Atrasado</SelectItem>
                  <SelectItem value="completed">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Cliente</label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Próximas ao prazo</label>
              <Button variant={dueSoonFilter ? "default" : "outline"} className="w-full" onClick={() => setDueSoonFilter(!dueSoonFilter)}>
                {dueSoonFilter ? "Filtro ativo" : "Todas as tarefas"}
              </Button>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Busca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input type="text" placeholder="Buscar tarefas..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Lista de Tarefas</CardTitle>
            <CardDescription>
              Gerenciamento completo de tarefas do sistema ({sortedTasks.length} {sortedTasks.length === 1 ? 'tarefa' : 'tarefas'})
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sortedTasks.length > 0 ? (
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  clients={clients}
                  cases={cases}
                  onViewTask={handleViewTask}
                  onEdit={() => {
                    setSelectedTask(task);
                    handleEditTask();
                  }}
                  onDeleteTask={confirmDeleteTask}
                  getClientName={getClientName}
                  getCaseName={getCaseName}
                  isCloseToDueDateOrOverdue={isCloseToDueDateOrOverdue(task)}
                  showActions={true}
                  clickable={true}
                  onTaskClick={handleViewTask}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-sm">Crie uma nova tarefa ou ajuste os filtros de busca.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog for adding new tasks */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título da tarefa</label>
              <Input type="text" placeholder="Digite o título da tarefa" value={newTask.title} onChange={e => setNewTask({
                ...newTask,
                title: e.target.value
              })} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea placeholder="Detalhe a tarefa a ser realizada" value={newTask.description} onChange={e => setNewTask({
                ...newTask,
                description: e.target.value
              })} rows={3} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Select value={newTask.clientId} onValueChange={value => {
                  setNewTask({
                    ...newTask,
                    clientId: value,
                    caseId: ''
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Atendimento (opcional)</label>
                <Select value={newTask.caseId} onValueChange={value => setNewTask({
                  ...newTask,
                  caseId: value
                })} disabled={!newTask.clientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {newTask.clientId && getClientCases(newTask.clientId).map(caseItem => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.description || caseItem.subCategory || caseItem.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data e hora de início</label>
                <Input type="datetime-local" value={newTask.startDate} onChange={e => setNewTask({
                  ...newTask,
                  startDate: e.target.value
                })} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data e hora de prazo</label>
                <Input type="datetime-local" value={newTask.endDate} onChange={e => setNewTask({
                  ...newTask,
                  endDate: e.target.value
                })} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newTask.status} onValueChange={value => setNewTask({
                ...newTask,
                status: value as Status
              })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analysis">Em análise</SelectItem>
                  <SelectItem value="in-progress">Em tramitação</SelectItem>
                  <SelectItem value="delayed">Atrasado</SelectItem>
                  <SelectItem value="completed">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Anexos</h3>
              <FileUploadInput onAddAttachment={handleAddAttachment} />
              
              {newTask.attachments.length > 0 && (
                <div className="border rounded-md p-3 space-y-2">
                  {newTask.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {attachment.type === 'image' && <Image className="h-4 w-4" />}
                        {attachment.type === 'link' && <Paperclip className="h-4 w-4" />}
                        {attachment.type === 'document' && <FileText className="h-4 w-4" />}
                        <span>{attachment.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveAttachment(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTask(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTask}>
              Adicionar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for viewing task details */}
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
                      <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => {
                        navigate(`/clients/${selectedTask.clientId}`);
                        setIsViewingTask(false);
                      }}>
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
                        <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => {
                          navigate(`/cases/${selectedTask.caseId}/timeline`);
                          setIsViewingTask(false);
                        }}>
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
            <div className="flex justify-between w-full">
              <Button variant="destructive" onClick={() => confirmDeleteTask(selectedTask?.id || '')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
              
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsViewingTask(false)}>
                  Fechar
                </Button>
                <Button onClick={handleEditTask}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing task */}
      <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título da tarefa</label>
              <Input type="text" placeholder="Digite o título da tarefa" value={newTask.title} onChange={e => setNewTask({
                ...newTask,
                title: e.target.value
              })} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea placeholder="Detalhe a tarefa a ser realizada" value={newTask.description} onChange={e => setNewTask({
                ...newTask,
                description: e.target.value
              })} rows={3} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Select value={newTask.clientId} onValueChange={value => {
                  setNewTask({
                    ...newTask,
                    clientId: value,
                    caseId: ''
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Atendimento (opcional)</label>
                <Select value={newTask.caseId} onValueChange={value => setNewTask({
                  ...newTask,
                  caseId: value
                })} disabled={!newTask.clientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {newTask.clientId && getClientCases(newTask.clientId).map(caseItem => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.description || caseItem.subCategory || caseItem.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data e hora de início</label>
                <Input type="datetime-local" value={newTask.startDate} onChange={e => setNewTask({
                  ...newTask,
                  startDate: e.target.value
                })} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data e hora de prazo</label>
                <Input type="datetime-local" value={newTask.endDate} onChange={e => setNewTask({
                  ...newTask,
                  endDate: e.target.value
                })} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newTask.status} onValueChange={value => setNewTask({
                ...newTask,
                status: value as Status
              })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analysis">Em análise</SelectItem>
                  <SelectItem value="in-progress">Em tramitação</SelectItem>
                  <SelectItem value="delayed">Atrasado</SelectItem>
                  <SelectItem value="completed">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Anexos</h3>
              <FileUploadInput onAddAttachment={handleAddAttachment} />
              
              {newTask.attachments.length > 0 && (
                <div className="border rounded-md p-3 space-y-2">
                  {newTask.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {attachment.type === 'image' && <Image className="h-4 w-4" />}
                        {attachment.type === 'link' && <Paperclip className="h-4 w-4" />}
                        {attachment.type === 'document' && <FileText className="h-4 w-4" />}
                        <span>{attachment.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveAttachment(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            <TaskUpdateSection updates={newTask.updates} onAddUpdate={handleAddUpdate} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTask(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTask}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alert Dialog for task deletion confirmation */}
      <AlertDialog open={!!taskToDelete} onOpenChange={open => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tasks;