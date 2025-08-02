import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  FileText, 
  Paperclip,
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  ArrowRight,
  User,
} from 'lucide-react';
import { Status, Task, Attachment, JudicialProcess } from '@/types';
import { Button } from '@/components/ui/button';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants';

export type TimelineEvent = {
  id: string;
  type: 'creation' | 'status_change' | 'client_update' | 'attachment' | 'judicial_process' | 'task';
  timestamp: string;
  title: string;
  description: string;
  data?: any;
};

interface ConsultationTimelineProps {
  consultationId: string;
  createdAt: string;
  status: Status;
  clientId: string;
  clientName: string;
  description: string;
  attachments?: Attachment[];
  tasks?: Task[];
  judicialProcesses?: JudicialProcess[];
}

export const ConsultationTimeline = ({
  consultationId,
  createdAt,
  status,
  clientId,
  clientName,
  description,
  attachments = [],
  tasks = [],
  judicialProcesses = []
}: ConsultationTimelineProps) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Generate timeline events from data
  const generateTimelineEvents = (): TimelineEvent[] => {
    let events: TimelineEvent[] = [];
    
    // Add consultation creation event
    events.push({
      id: `creation-${consultationId}`,
      type: 'creation',
      timestamp: createdAt,
      title: 'Atendimento iniciado',
      description: `Atendimento iniciado para ${clientName}`,
      data: {
        description,
        status
      }
    });
    
    // Add attachment events
    attachments.forEach(attachment => {
      events.push({
        id: `attachment-${attachment.id}`,
        type: 'attachment',
        timestamp: attachment.uploadDate,
        title: 'Anexo adicionado',
        description: attachment.description || 'Sem descrição',
        data: attachment
      });
    });
    
    // Add judicial process events
    judicialProcesses.forEach(process => {
      events.push({
        id: `judicial-${process.id}`,
        type: 'judicial_process',
        timestamp: process.updatedAt,
        title: 'Processo judicial vinculado',
        description: `Processo ${process.numeroProcesso} vinculado ao atendimento`,
        data: process
      });
    });
    
    // Add task events
    tasks.forEach(task => {
      events.push({
        id: `task-${task.id}`,
        type: 'task',
        timestamp: task.createdAt,
        title: 'Tarefa adicionada',
        description: task.title,
        data: task
      });
    });
    
    // Sort by timestamp (newest first)
    return events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const timelineEvents = generateTimelineEvents();

  const formatDateTime = (dateTimeString: string) => {
    const dateTime = new Date(dateTimeString);
    return {
      date: dateTime.toLocaleDateString('pt-BR'),
      time: dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'creation': return <User className="h-5 w-5 text-blue-500" />;
      case 'attachment': return <Paperclip className="h-5 w-5 text-amber-500" />;
      case 'judicial_process': return <FileText className="h-5 w-5 text-praxis-olive" />;
      case 'task': return <Calendar className="h-5 w-5 text-purple-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Linha do Tempo do Atendimento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 border-l-2 border-muted space-y-6">
          {timelineEvents.map((event) => {
            const { date, time } = formatDateTime(event.timestamp);
            const isExpanded = expandedItems[event.id] || false;
            
            return (
              <div key={event.id} className="relative">
                <div className="absolute -left-[23px] mt-1 p-1 rounded-full bg-white border-2 border-muted">
                  {getEventIcon(event.type)}
                </div>
                
                <div 
                  className="mb-4 cursor-pointer hover:bg-muted/30 p-3 rounded-lg transition-colors"
                  onClick={() => toggleExpand(event.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg">{event.title}</h3>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-muted-foreground">{event.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{date}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{time}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Extended details when expanded */}
                  {isExpanded && (
                    <div className="mt-4 pl-4 border-l-2 border-dotted border-muted">
                      {event.type === 'creation' && (
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="font-medium min-w-36">Descrição:</span>
                            <span>{event.data.description}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium min-w-36">Status inicial:</span>
                            <span className={`text-xs rounded-full px-2.5 py-0.5 ${STATUS_COLORS[event.data.status]}`}>
                              {STATUS_LABELS[event.data.status]}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium min-w-36">Cliente:</span>
                            <span>{clientName}</span>
                          </div>
                        </div>
                      )}
                      
                      {event.type === 'attachment' && (
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="font-medium min-w-36">Nome do arquivo:</span>
                            <span>{event.data.fileName}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium min-w-36">Descrição:</span>
                            <span>{event.data.description || 'Sem descrição'}</span>
                          </div>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Paperclip className="h-4 w-4 mr-2" />
                            Visualizar anexo
                          </Button>
                        </div>
                      )}
                      
                      {event.type === 'judicial_process' && (
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="font-medium min-w-36">Número do processo:</span>
                            <span>{event.data.numeroProcesso}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium min-w-36">Tribunal:</span>
                            <span>{event.data.tribunal}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/judicial-processes/${event.data.id}`;
                            }}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Ver processo judicial
                          </Button>
                        </div>
                      )}
                      
                      {event.type === 'task' && (
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="font-medium min-w-36">Título:</span>
                            <span>{event.data.title}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium min-w-36">Descrição:</span>
                            <span>{event.data.description}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium min-w-36">Status:</span>
                            <span className={`text-xs rounded-full px-2.5 py-0.5 ${STATUS_COLORS[event.data.status]}`}>
                              {STATUS_LABELS[event.data.status]}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <span className="font-medium min-w-36">Data limite:</span>
                            <span>{new Date(event.data.endDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
