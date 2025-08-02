import { useState } from 'react';
import { Task, Status, TaskAttachment, Client, Case } from '@/types';
import { 
  AlertCircle, Clock, CircleCheck, File, 
  Paperclip, Calendar, User, FileText, 
  Image, ChevronDown, ChevronUp, History
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useHoverEffect } from '@/hooks/useHoverEffect';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

interface TaskCardProps {
  task: Task;
  clients?: Client[];
  cases?: Case[];
  onView?: (task: Task) => void;
  onViewTask?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdate?: (id: string, task: Task) => void;
  getClientName?: (clientId: string) => string;
  getCaseName?: (caseId: string | undefined) => string;
  isCloseToDueDateOrOverdue?: boolean;
  showActions?: boolean;
  clickable?: boolean;
  onTaskClick?: (task: Task) => void;
}

export const TaskCard = ({
  task,
  clients,
  cases,
  onView,
  onViewTask,
  onEdit,
  onDelete,
  onDeleteTask,
  onUpdate,
  getClientName,
  getCaseName,
  isCloseToDueDateOrOverdue,
  showActions = true,
  clickable = false,
  onTaskClick
}: TaskCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();
  
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
        return <CircleCheck className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'analysis':
        return <File className="h-5 w-5 text-amber-600" />;
    }
  };

  const getAttachmentIcon = (attachment: TaskAttachment) => {
    switch (attachment.type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Paperclip className="h-4 w-4" />;
    }
  };

  const getClientNameHelper = (clientId: string) => {
    if (getClientName) {
      return getClientName(clientId);
    }
    if (clients) {
      const client = clients.find(c => c.id === clientId);
      return client?.name || 'Cliente não encontrado';
    }
    return 'Cliente';
  };

  const getCaseNameHelper = (caseId: string | undefined) => {
    if (!caseId) return '';
    if (getCaseName) {
      return getCaseName(caseId);
    }
    if (cases) {
      const caseItem = cases.find(c => c.id === caseId);
      return caseItem?.description || 'Atendimento não encontrado';
    }
    return 'Atendimento';
  };

  const handleViewClick = () => {
    if (onView) {
      onView(task);
    } else if (onViewTask) {
      onViewTask(task);
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(task.id);
    } else if (onDeleteTask) {
      onDeleteTask(task.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (clickable && onTaskClick) {
      e.preventDefault();
      onTaskClick(task);
    }
  };

  return (
    <Card 
      className={`w-full mb-4 transition-all duration-200 ${
        isCloseToDueDateOrOverdue ? 'border-amber-200 bg-amber-50' : ''
      } ${clickable ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={clickable ? (e) => handleMouseEnter(e, 0.6) : undefined}
      onMouseLeave={clickable ? handleMouseLeave : undefined}
    >
      <CardContent className="p-4 relative">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2 flex-1">
            <div className="pt-1">{getStatusIcon(task.status)}</div>
            <div className="flex-1">
              <div className="font-medium">{task.title}</div>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>
          <StatusBadge status={task.status} useCustomization />
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {task.endDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Prazo: {formatDate(task.endDate)}</span>
            </div>
          )}
          
          {task.startDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Início: {formatDate(task.startDate)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 col-span-2">
            <User className="h-3 w-3" />
            <span>Cliente: {getClientNameHelper(task.clientId)}</span>
          </div>
          
          {task.caseId && (
            <div className="flex items-center gap-1 col-span-2">
              <FileText className="h-3 w-3" />
              <span>Atendimento: {getCaseNameHelper(task.caseId)}</span>
            </div>
          )}
          
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1 col-span-2">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments.length} anexo(s)</span>
            </div>
          )}
          
          {task.updates && task.updates.length > 0 && (
            <div className="flex items-center gap-1 col-span-2">
              <History className="h-3 w-3" />
              <span>{task.updates.length} atualização(es)</span>
            </div>
          )}
        </div>
        
        {showActions && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                {isOpen ? (
                  <>Ocultar detalhes <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Ver detalhes <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-2 space-y-2">
                {task.attachments && task.attachments.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="text-xs font-medium">Anexos:</h5>
                    <ul className="text-xs space-y-1">
                      {task.attachments.slice(0, 3).map((attachment, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          {getAttachmentIcon(attachment)}
                          <span className="line-clamp-1">{attachment.name}</span>
                        </li>
                      ))}
                      {task.attachments.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          + {task.attachments.length - 3} mais anexo(s)
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                {task.updates && task.updates.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="text-xs font-medium">Últimas atualizações:</h5>
                    <ul className="text-xs space-y-1">
                      {task.updates.slice(0, 2).map((update) => (
                        <li key={update.id} className="border-l-2 border-muted-foreground/30 pl-2 py-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{update.userName || "Usuário"}</span>
                            <span className="text-muted-foreground">{formatDate(update.date)}</span>
                          </div>
                          <p className="line-clamp-2">{update.description}</p>
                        </li>
                      ))}
                      {task.updates.length > 2 && (
                        <li className="text-xs text-muted-foreground">
                          + {task.updates.length - 2} mais atualização(es)
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                {(handleViewClick || onView || onViewTask) && (
                  <SubscriptionAccessWrapper action="visualizar uma tarefa">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full mt-2" 
                      onClick={handleViewClick}
                    >
                      Visualizar tarefa completa
                    </Button>
                  </SubscriptionAccessWrapper>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
