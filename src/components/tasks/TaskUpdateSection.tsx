
import { useState } from 'react';
import { TaskUpdate } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { History as HistoryIcon, Plus, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskUpdateSectionProps {
  updates: TaskUpdate[];
  onAddUpdate: (update: TaskUpdate) => void;
  taskId?: string;
}

export const TaskUpdateSection = ({ updates, onAddUpdate, taskId = '' }: TaskUpdateSectionProps) => {
  const [newUpdate, setNewUpdate] = useState('');
  
  const handleAddUpdate = () => {
    if (!newUpdate.trim()) {
      toast.error('Digite uma atualização para adicionar');
      return;
    }
    
    const update: TaskUpdate = {
      id: `update-${Date.now()}`,
      taskId: taskId || `task-${Date.now()}`, // Ensure taskId is always present
      date: new Date().toISOString(),
      description: newUpdate,
      userName: 'Você' // In a real app, get from authentication context
    };
    
    onAddUpdate(update);
    setNewUpdate('');
    toast.success('Atualização adicionada com sucesso');
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium flex items-center gap-2">
          <HistoryIcon className="h-4 w-4" />
          Atualizações e acompanhamento
        </h3>
      </div>
      
      <div className="border rounded-md p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Adicionar nova atualização
          </label>
          <Textarea
            placeholder="Descreva o progresso ou atualizações sobre esta tarefa..."
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            className="min-h-[100px] resize-y"
          />
        </div>
        <div className="text-right">
          <Button onClick={handleAddUpdate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar atualização
          </Button>
        </div>
      </div>
      
      {updates.length > 0 ? (
        <div className="border rounded-md divide-y">
          {updates.map((update) => (
            <div key={update.id} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{update.userName || 'Usuário'}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(update.date)}</span>
                </div>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{update.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground border rounded-md">
          <HistoryIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Nenhuma atualização registrada</p>
          <p className="text-sm">Adicione atualizações para acompanhar o progresso desta tarefa.</p>
        </div>
      )}
    </div>
  );
};
