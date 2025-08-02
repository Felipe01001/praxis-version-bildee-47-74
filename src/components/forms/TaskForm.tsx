
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, Case, Client, Status } from '@/types';

interface TaskFormProps {
  clientId?: string;
  cases: Case[];
  clients: Client[];
  initialData?: Task;
  onSubmit: (taskData: Task | Omit<Task, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const TaskForm = ({ clientId, cases, clients, initialData, onSubmit, onCancel }: TaskFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || clientId || '');
  const [caseId, setCaseId] = useState(initialData?.caseId || '');
  const [status, setStatus] = useState(initialData?.status || 'in-progress');
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : ''
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId || !title.trim() || !startDate || !endDate) {
      return;
    }

    const taskData = {
      ...(initialData?.id && { id: initialData.id }),
      clientId: selectedClientId,
      title: title.trim(),
      description: description.trim(),
      status: status as Status,
      startDate: startDate,
      endDate: endDate,
      // Only include caseId if it's not empty
      ...(caseId && caseId !== '' && caseId !== 'none' && { caseId }),
      ...(initialData?.createdAt && { createdAt: initialData.createdAt }),
    };

    console.log('Dados da tarefa antes do envio:', taskData);
    onSubmit(taskData as any);
  };

  const filteredCases = cases.filter(c => c.clientId === selectedClientId);

  const handleStatusChange = (value: string) => {
    setStatus(value as Status);
  };

  const handleCaseChange = (value: string) => {
    // Se o valor for "none" ou vazio, definir como string vazia
    setCaseId(value === "none" ? "" : value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Digite o título da tarefa"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição detalhada da tarefa"
        />
      </div>

      {!clientId && (
        <div>
          <Label htmlFor="client">Cliente *</Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div>
        <Label htmlFor="case">Atendimento (Opcional)</Label>
        <Select value={caseId} onValueChange={handleCaseChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um atendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum atendimento</SelectItem>
            {filteredCases.map((caseItem) => (
              <SelectItem key={caseItem.id} value={caseItem.id}>
                {caseItem.description || caseItem.subCategory || `Caso ${caseItem.id.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-progress">Em andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="delayed">Atrasado</SelectItem>
            <SelectItem value="analysis">Em análise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Data de Início *</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="endDate">Data de Fim *</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="submit"
          disabled={!selectedClientId || !title.trim() || !startDate || !endDate}
        >
          {initialData ? 'Atualizar' : 'Criar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};
