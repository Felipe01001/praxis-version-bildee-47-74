import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants';
import { format, isToday, isSameDay, isBefore, addDays } from 'date-fns';
import { ptBR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Plus, Kanban, Filter, CheckCircle2, Calendar as CalendarView, ChevronRight, ChevronLeft, X, CalendarDays, Trash2, Edit, AlertCircle, CircleCheck, File } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Status, Task } from '@/types';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { StatusBadge } from '@/components/StatusBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useIsMobile } from '@/hooks/use-mobile';
import { useHoverEffect } from '@/hooks/useHoverEffect';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

const Calendar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    tasks,
    clients,
    cases,
    addTask,
    updateTask,
    deleteTask
  } = usePraxisContext();
  const {
    caseStatusColors,
    taskStatusColors
  } = useTheme();
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'day' | 'month' | 'kanban'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for task creation and management
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
    attachments: [],
    updates: []
  });

  // Filter and search state
  const [kanbanFilter, setKanbanFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');

  // Initialize tasksWithDate
  const tasksWithDate = tasks.map(task => {
    const client = clients.find(c => c.id === task.clientId);
    const caseItem = task.caseId ? cases.find(c => c.id === task.caseId) : undefined;
    return {
      ...task,
      clientName: client?.name || 'Cliente não encontrado',
      caseName: caseItem?.description || caseItem?.subCategory || '',
      startDateTime: new Date(task.startDate),
      endDateTime: new Date(task.endDate)
    };
  });

  // Calculate tasks by date
  const tasksByDate = selectedDate ? tasksWithDate.filter(task => isSameDay(task.startDateTime, selectedDate) || isSameDay(task.endDateTime, selectedDate)) : [];

  // Filtered tasks for Kanban view
  const filteredTasks = tasksWithDate.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesSearch = !searchTerm || task.title.toLowerCase().includes(searchTerm.toLowerCase()) || (task.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || (task.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const today = new Date();

    // Additional filter for Kanban view
    if (view === 'kanban') {
      switch (kanbanFilter) {
        case 'today':
          return matchesStatus && matchesSearch && (isSameDay(task.startDateTime, today) || isSameDay(task.endDateTime, today));
        case 'week':
          const nextWeek = addDays(today, 7);
          return matchesStatus && matchesSearch && isBefore(task.endDateTime, nextWeek) && !isBefore(task.endDateTime, today);
        case 'overdue':
          return matchesStatus && matchesSearch && isBefore(task.endDateTime, today) && task.status !== 'completed';
        default:
          return matchesStatus && matchesSearch;
      }
    }
    return matchesStatus && matchesSearch;
  });

  // Group tasks by status for Kanban view
  const tasksByStatus = {
    'analysis': filteredTasks.filter(task => task.status === 'analysis'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    'delayed': filteredTasks.filter(task => task.status === 'delayed'),
    'completed': filteredTasks.filter(task => task.status === 'completed')
  };

  // Generate calendar dates with task indicators
  const getTasksForDate = (date: Date) => {
    return tasksWithDate.filter(task => isSameDay(task.startDateTime, date) || isSameDay(task.endDateTime, date));
  };

  // Sort tasks by time
  const sortedTasks = [...tasksByDate].sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  // Handle task click to navigate to client's tasks tab
  const handleTaskClick = (task: Task & {
    clientName: string;
    startDateTime: Date;
    endDateTime: Date;
  }) => {
    setSelectedTask(task);
    setIsViewingTask(true);
  };

  // Handle adding task
  const handleAddTask = () => {
    if (!newTask.title || !newTask.clientId || !newTask.startDate || !newTask.endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    addTask({
      title: newTask.title,
      description: newTask.description,
      clientId: newTask.clientId,
      caseId: newTask.caseId || undefined,
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      status: newTask.status,
      attachments: newTask.attachments,
      updates: newTask.updates
    });
    resetTaskForm();
    setIsAddingTask(false);
    toast.success('Tarefa adicionada com sucesso');
  };

  // Handle updating task
  const handleUpdateTask = () => {
    if (!selectedTask || !newTask.title || !newTask.startDate || !newTask.endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    updateTask(selectedTask.id, {
      ...selectedTask,
      title: newTask.title,
      description: newTask.description,
      clientId: newTask.clientId,
      caseId: newTask.caseId || undefined,
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      status: newTask.status,
      attachments: newTask.attachments || [],
      updates: newTask.updates || []
    });
    resetTaskForm();
    setIsEditingTask(false);
    toast.success('Tarefa atualizada com sucesso');
  };

  // Handle task status update (for Kanban drag-and-drop)
  const handleTaskStatusUpdate = (taskId: string, newStatus: Status) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask(taskId, {
        ...task,
        status: newStatus
      });
      toast.success(`Status da tarefa atualizado para ${STATUS_LABELS[newStatus]}`);
    }
  };

  // Handle task deletion
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

  // Handle edit task
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
  const getClientCases = (clientId: string) => {
    return cases.filter(c => c.clientId === clientId);
  };

  // Month navigation for calendar
  const previousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  const nextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  // Reset task form
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

  // Format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', {
        locale: ptBR
      });
    } catch (error) {
      return 'Data inválida';
    }
  };
  const formatFullDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', {
        locale: ptBR
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Get status color based on task status
  const getStatusColor = (status: Status) => {
    return taskStatusColors[status] || caseStatusColors[status];
  };

  // Get status icon based on task status
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'completed':
        return <CircleCheck className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'analysis':
        return <File className="h-5 w-5 text-amber-600" />;
    }
  };

  // Check if a task is close to deadline (3 days or less)
  const isCloseToDueDateOrOverdue = (task: Task) => {
    const now = new Date();
    const deadline = new Date(task.endDate);
    const daysDiff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 3;
  };

  // Calendar modifiers for task indicators
  const modifiers = {
    hasTasks: (date: Date) => getTasksForDate(date).length > 0,
    today: (date: Date) => isToday(date)
  };

  // Component for Kanban column
  const KanbanColumn = ({
    status,
    tasks
  }: {
    status: Status;
    tasks: Array<Task & {
      clientName: string;
      startDateTime: Date;
      endDateTime: Date;
      caseName?: string;
    }>;
  }) => <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2 px-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <h3 className="font-medium">{STATUS_LABELS[status]}</h3>
        </div>
        <Badge variant="outline">{tasks.length}</Badge>
      </div>
      
      <div className="flex-1 bg-muted/30 rounded-lg p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]" style={{
      minHeight: '200px'
    }}>
        {tasks.length > 0 ? tasks.map(task => <Card 
            key={task.id} 
            className={`w-full cursor-pointer transition-all hover:shadow-md duration-200 ${isCloseToDueDateOrOverdue(task) && status !== 'completed' ? 'border-amber-200 bg-amber-50/50' : ''}`} 
            onClick={() => handleTaskClick(task)}
            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
            onMouseLeave={handleMouseLeave}
          >
            <CardContent className="p-3">
              <div className="font-medium line-clamp-2">{task.title}</div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  <span>Prazo: {formatDate(task.endDate)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(task.startDateTime, 'HH:mm')} - {format(task.endDateTime, 'HH:mm')}</span>
                </div>
              </div>
              
              {task.clientName && <div className="mt-1 text-xs flex items-center gap-1">
                  <span className="font-medium">{task.clientName}</span>
                </div>}
              
              <div className="flex justify-between items-center mt-2">
                {task.caseName && <span className="text-xs px-2 py-0.5 bg-primary/10 rounded-full truncate max-w-[150px]">
                    {task.caseName}
                  </span>}
                
                <div className="flex gap-1">
                  {task.attachments?.length > 0 && <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full">
                      {task.attachments.length} anexo(s)
                    </span>}
                </div>
              </div>
            </CardContent>
          </Card>) : <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
              <Plus className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-sm">Sem tarefas</p>
          </div>}
      </div>
    </div>;

  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text">Agenda</h1>
        
        <div className="flex items-center space-x-2">
          <SubscriptionAccessWrapper action="criar uma nova tarefa">
            <Button variant="outline" onClick={() => setIsAddingTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </SubscriptionAccessWrapper>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Todos os status
                {statusFilter === 'all' && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('analysis')}>
                Em análise
                {statusFilter === 'analysis' && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>
                Em andamento
                {statusFilter === 'in-progress' && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('delayed')}>
                Atrasado
                {statusFilter === 'delayed' && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                Concluído
                {statusFilter === 'completed' && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Input placeholder="Buscar tarefas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-40 sm:w-64" />
          {searchTerm && <Button variant="ghost" size="icon" onClick={() => setSearchTerm('')}>
              <X className="h-4 w-4" />
            </Button>}
        </div>
      </div>
      
      <Tabs value={view} onValueChange={v => setView(v as 'day' | 'month' | 'kanban')}>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="month">
              <CalendarDays className="h-4 w-4 mr-2" />
              Mês
            </TabsTrigger>
            <TabsTrigger value="day">
              <CalendarView className="h-4 w-4 mr-2" />
              Dia
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </TabsTrigger>
          </TabsList>
          
          {view === 'kanban' && <div className="flex gap-2">
              <Select value={kanbanFilter} onValueChange={(value: any) => setKanbanFilter(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tarefas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Próximos 7 dias</SelectItem>
                  <SelectItem value="overdue">Atrasadas</SelectItem>
                </SelectContent>
              </Select>
            </div>}
          
          {view !== 'kanban' && <div className="flex flex-wrap items-center gap-2 justify-end">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{
              backgroundColor: taskStatusColors.completed
            }}></div>
                <span className="text-xs">Finalizado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{
              backgroundColor: taskStatusColors['in-progress']
            }}></div>
                <span className="text-xs">Em tramitação</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{
              backgroundColor: taskStatusColors.delayed
            }}></div>
                <span className="text-xs">Atrasado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{
              backgroundColor: taskStatusColors.analysis
            }}></div>
                <span className="text-xs">Em análise</span>
              </div>
            </div>}
        </div>
        
        {/* Month View */}
        <TabsContent value="month">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Calendar Card - 1/2 width on md, 1/3 on lg */}
            <Card className="md:col-span-1 lg:col-span-1 px-[28px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-semibold text-center">Calendário</CardTitle>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="py-0 px-[2px]">
                <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} month={currentMonth} onMonthChange={setCurrentMonth} locale={ptBR} modifiersStyles={{
                today: {
                  fontWeight: 'bold',
                  color: '#6CAE75'
                },
                selected: {
                  color: 'white',
                  backgroundColor: '#8B9474'
                },
                hasTasks: {
                  backgroundColor: 'rgba(108, 174, 117, 0.15)',
                  borderRadius: '100%'
                }
              }} modifiers={{
                hasTasks: (date: Date) => getTasksForDate(date).length > 0,
                today: (date: Date) => isToday(date)
              }} modifiersClassNames={{
                today: "bg-praxis-light-green/10"
              }} className="rounded-md border pointer-events-auto py-0 px-0" />
                
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-2 text-center">
                    {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
                    {selectedDate && isToday(selectedDate) && ' (Hoje)'}
                  </h3>
                  
                  {tasksByDate.length > 0 ? <p className="text-sm text-muted-foreground text-center">
                      {tasksByDate.length} {tasksByDate.length === 1 ? 'tarefa' : 'tarefas'} para este dia
                    </p> : <p className="text-sm text-muted-foreground">
                      Sem tarefas para este dia
                    </p>}
                </div>
              </CardContent>
            </Card>
            
            {/* Tasks List Card - 1/2 width on md, 2/3 on lg */}
            <Card className="md:col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedDate && format(selectedDate, 'MMMM yyyy', {
                  locale: ptBR
                })}
                </CardTitle>
              </CardHeader>
              <CardContent className="mx-0 px-[3px]">
                {sortedTasks.length > 0 ? <div className="space-y-6">
                    {sortedTasks.map(task => {
                  const startTime = format(task.startDateTime, 'HH:mm');
                  const endTime = format(task.endDateTime, 'HH:mm');
                  const statusColor = getStatusColor(task.status);
                  return <div 
                          key={task.id} 
                          className="border-l-4 pl-4 py-2 cursor-pointer transition-all duration-200 rounded-r-md" 
                          style={{
                            borderLeftColor: statusColor
                          }} 
                          onClick={() => handleTaskClick(task)}
                          onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="font-medium">{task.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{task.clientName}</p>
                            </div>
                            <div className="mt-2 sm:mt-0 flex items-center gap-2">
                              <span className="text-xs rounded-full px-2.5 py-0.5" style={{
                          backgroundColor: `${statusColor}30`,
                          // 30% opacity
                          color: statusColor
                        }}>
                                {STATUS_LABELS[task.status]}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{startTime} - {endTime}</span>
                          </div>
                          
                          {task.description && <p className="mt-2 text-sm">{task.description}</p>}
                        </div>;
                })}
                  </div> : <div className="py-12 text-center">
                    <CalendarIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium">Sem tarefas para este dia</h3>
                    <p className="text-muted-foreground mt-1">
                      Selecione outro dia ou adicione uma nova tarefa
                    </p>
                  </div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Day View */}
        <TabsContent value="day">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Calendar Card - 1/2 width on md, 1/3 on lg */}
            <Card className="md:col-span-1 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Calendário</CardTitle>
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} month={currentMonth} onMonthChange={setCurrentMonth} className="rounded-md border pointer-events-auto" locale={ptBR} modifiersStyles={{
                today: {
                  fontWeight: 'bold',
                  color: '#6CAE75'
                },
                selected: {
                  color: 'white',
                  backgroundColor: '#8B9474'
                },
                hasTasks: {
                  backgroundColor: 'rgba(108, 174, 117, 0.15)',
                  borderRadius: '100%'
                }
              }} modifiers={{
                hasTasks: (date: Date) => getTasksForDate(date).length > 0,
                today: (date: Date) => isToday(date)
              }} modifiersClassNames={{
                today: "bg-praxis-light-green/10"
              }} />
                
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-2 text-center">
                    {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
                    {selectedDate && isToday(selectedDate) && ' (Hoje)'}
                  </h3>
                  
                  {tasksByDate.length > 0 ? <p className="text-sm text-muted-foreground text-center">
                      {tasksByDate.length} {tasksByDate.length === 1 ? 'tarefa' : 'tarefas'} para este dia
                    </p> : <p className="text-sm text-muted-foreground">
                      Sem tarefas para este dia
                    </p>}
                </div>
              </CardContent>
            </Card>
            
            {/* Day View Card - Lista simples de atividades */}
            <Card className="md:col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedDate && format(selectedDate, 'EEEE, dd/MM/yyyy', {
                  locale: ptBR
                })}
                </CardTitle>
                <CardDescription>
                  Atividades do dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedTasks.length > 0 ? <div className="divide-y divide-gray-100">
                      {sortedTasks.map(task => {
                    const startTime = format(task.startDateTime, 'HH:mm');
                    const endTime = format(task.endDateTime, 'HH:mm');
                    const statusColor = getStatusColor(task.status);
                    return <div 
                            key={task.id} 
                            className="py-4 cursor-pointer transition-all duration-200 rounded-md" 
                            onClick={() => handleTaskClick(task)}
                            onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="flex flex-row items-start gap-3">
                              <div className="w-1 h-full min-h-[36px] rounded-full self-stretch" style={{
                          backgroundColor: statusColor
                        }} />
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <h3 className="font-medium">{task.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{task.clientName}</p>
                                  </div>
                                  <div className="mt-2 sm:mt-0">
                                    <div className="flex flex-wrap gap-2">
                                      <span className="text-xs rounded-full px-2.5 py-0.5" style={{
                                  backgroundColor: `${statusColor}30`,
                                  // 30% opacity
                                  color: statusColor
                                }}>
                                        {STATUS_LABELS[task.status]}
                                      </span>
                                      <span className="text-xs rounded-full bg-gray-100 px-2.5 py-0.5">
                                        {startTime} - {endTime}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {task.description && <p className="mt-2 text-sm line-clamp-2">{task.description}</p>}
                                
                                {task.caseName && <Badge variant="outline" className="mt-2">
                                    {task.caseName}
                                  </Badge>}
                              </div>
                            </div>
                          </div>;
                  })}
                    </div> : <div className="py-12 text-center">
                      <CalendarIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                      <h3 className="text-lg font-medium">Sem tarefas para este dia</h3>
                      <p className="text-muted-foreground mt-1">
                        Selecione outro dia ou adicione uma nova tarefa
                      </p>
                      <Button variant="outline" className="mt-4" onClick={() => setIsAddingTask(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar tarefa
                      </Button>
                    </div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Kanban View */}
        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KanbanColumn status="analysis" tasks={tasksByStatus.analysis} />
            <KanbanColumn status="in-progress" tasks={tasksByStatus['in-progress']} />
            <KanbanColumn status="delayed" tasks={tasksByStatus.delayed} />
            <KanbanColumn status="completed" tasks={tasksByStatus.completed} />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dialog for adding/editing tasks */}
      <Dialog open={isAddingTask || isEditingTask} onOpenChange={isOpen => {
      if (!isOpen) {
        setIsAddingTask(false);
        setIsEditingTask(false);
        resetTaskForm();
      }
    }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
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
                    {clients.map(client => <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>)}
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
                    {newTask.clientId && getClientCases(newTask.clientId).map(caseItem => <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.description || caseItem.subCategory || caseItem.id}
                      </SelectItem>)}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
            setIsAddingTask(false);
            setIsEditingTask(false);
            resetTaskForm();
          }}>
              Cancelar
            </Button>
            <Button onClick={isEditingTask ? handleUpdateTask : handleAddTask}>
              {isEditingTask ? 'Salvar alterações' : 'Adicionar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for task details */}
      <Dialog open={isViewingTask} onOpenChange={setIsViewingTask}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Tarefa</DialogTitle>
          </DialogHeader>
          {selectedTask && <div className="py-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{selectedTask.title}</h2>
                <StatusBadge status={selectedTask.status} useCustomization />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Cliente</h4>
                  <p>{selectedTask.clientName}</p>
                </div>
                
                {selectedTask.caseId && <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Atendimento vinculado</h4>
                    <p>{cases.find(c => c.id === selectedTask.caseId)?.description || 'Atendimento não encontrado'}</p>
                  </div>}
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Data de início</h4>
                  <p>{formatFullDate(selectedTask.startDate)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Prazo</h4>
                  <p>{formatFullDate(selectedTask.endDate)}</p>
                </div>
              </div>
              
              {selectedTask.description && <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
                  <div className="bg-muted/30 p-3 rounded-md">
                    <p className="whitespace-pre-wrap">{selectedTask.description}</p>
                  </div>
                </div>}
              
              {selectedTask.attachments && selectedTask.attachments.length > 0 && <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Anexos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTask.attachments.map((attachment, idx) => <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                        <div className="truncate flex-1">{attachment.name}</div>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                            Ver
                          </a>
                        </Button>
                      </div>)}
                  </div>
                </div>}
              
              {selectedTask.updates && selectedTask.updates.length > 0 && <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Atualizações</h4>
                  <div className="space-y-2">
                    {selectedTask.updates.map(update => <div key={update.id} className="border-l-2 border-muted pl-3 py-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{update.userName || "Usuário"}</span>
                          <span className="text-muted-foreground text-sm">{formatDate(update.date)}</span>
                        </div>
                        <p className="text-sm mt-1">{update.description}</p>
                      </div>)}
                  </div>
                </div>}
            </div>}
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
      
      {/* Delete Task Confirmation */}
      <AlertDialog open={!!taskToDelete} onOpenChange={isOpen => !isOpen && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};

export default Calendar;
