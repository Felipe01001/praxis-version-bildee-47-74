
import { Folder, Calendar } from 'lucide-react';
import { Client, Case, Task } from '@/types';
import { CATEGORY_LABELS, SUBCATEGORIES, STATUS_COLORS, STATUS_LABELS } from '@/constants';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientInfoCards } from './ClientInfoCards';
import { usePraxisContext } from '@/context/PraxisContext';
import { useHoverEffect } from '@/hooks/useHoverEffect';
import { useNavigate } from 'react-router-dom';
import JudicialProcessesCard from '../dashboard/JudicialProcessesCard';

interface OverviewTabProps {
  client: Client;
  cases: Case[];
  tasks: Task[];
  onTabChange: (tab: string) => void;
}

export const OverviewTab = ({ client, cases, tasks, onTabChange }: OverviewTabProps) => {
  const navigate = useNavigate();
  const { handleMouseEnter, handleMouseLeave } = useHoverEffect();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const { judicialProcesses = [] } = usePraxisContext();
  
  // Get only the judicial processes related to this client
  const clientJudicialProcesses = judicialProcesses.filter(
    process => process.clientId === client.id
  );

  const handleCaseClick = (caseId: string) => {
    navigate(`/cases/${caseId}/timeline`);
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks?taskId=${taskId}`);
  };

  return (
    <div className="space-y-6">
      <ClientInfoCards client={client} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Atendimentos Recentes</CardTitle>
              <CardDescription>
                {cases.length} {cases.length === 1 ? 'atendimento' : 'atendimentos'} cadastrados
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onTabChange('cases')}
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {cases.length > 0 ? (
              <div className="space-y-4">
                {cases.slice(0, 3).map((caseItem) => {
                  const subcategoryLabel = SUBCATEGORIES[caseItem.category]?.find(
                    s => s.value === caseItem.subCategory
                  )?.label || caseItem.subCategory;
                  
                  return (
                    <div 
                      key={caseItem.id} 
                      className="flex items-start justify-between pb-4 border-b last:pb-0 last:border-0 cursor-pointer transition-colors rounded p-2 -m-2"
                      onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleCaseClick(caseItem.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-praxis-olive" />
                          <span className="font-medium">{subcategoryLabel}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {caseItem.description}
                        </p>
                      </div>
                      <span className={`text-xs rounded-full px-2.5 py-0.5 ${STATUS_COLORS[caseItem.status]}`}>
                        {STATUS_LABELS[caseItem.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Nenhum atendimento cadastrado.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tarefas Próximas</CardTitle>
              <CardDescription>
                {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'} cadastradas
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onTabChange('tasks')}
            >
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks
                  .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                  .slice(0, 3)
                  .map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-start justify-between pb-4 border-b last:pb-0 last:border-0 cursor-pointer transition-colors rounded p-2 -m-2"
                      onMouseEnter={(e) => handleMouseEnter(e, 0.5)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-praxis-olive" />
                          <span className="font-medium">{task.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{formatDate(task.endDate)}</p>
                        <span className={`text-xs rounded-full px-2.5 py-0.5 mt-1 inline-block ${STATUS_COLORS[task.status]}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Nenhuma tarefa cadastrada.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Judicial Processes Card to the Overview */}
      <JudicialProcessesCard 
        clientId={client.id} 
        judicialProcesses={clientJudicialProcesses}
      />
    </div>
  );
};
