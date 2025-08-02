
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TaskForm } from '@/components/forms/TaskForm';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task, Case, Client } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TasksTabProps {
  tasks: Task[];
  clientId: string;
  cases: Case[];
  clients: Client[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const TasksTab = ({ 
  tasks, 
  clientId, 
  cases, 
  clients, 
  addTask, 
  updateTask, 
  deleteTask 
}: TasksTabProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      console.log('Adicionando tarefa com dados:', taskData);
      await addTask(taskData);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const handleUpdateTask = async (id: string, taskData: Task) => {
    try {
      console.log('Atualizando tarefa:', id, taskData);
      await updateTask(id, taskData);
      setEditingTask(null);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tarefas</h3>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <TaskForm
              clientId={clientId}
              cases={cases}
              clients={clients}
              onSubmit={handleAddTask}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length > 0 ? (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              clients={clients}
              cases={cases}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onUpdate={handleUpdateTask}
              clickable={true}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhuma tarefa cadastrada para este cliente.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Tarefa
            </Button>
          </CardContent>
        </Card>
      )}

      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            <TaskForm
              clientId={clientId}
              cases={cases}
              clients={clients}
              initialData={editingTask}
              onSubmit={(taskData) => handleUpdateTask(editingTask.id, taskData as Task)}
              onCancel={() => setEditingTask(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para exibir detalhes completos da tarefa */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <TaskCard
                task={selectedTask}
                clients={clients}
                cases={cases}
                showActions={true}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onUpdate={handleUpdateTask}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
