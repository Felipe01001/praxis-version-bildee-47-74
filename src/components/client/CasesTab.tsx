
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CaseForm } from '@/components/forms/CaseForm';
import { CaseCard } from '@/components/case/CaseCard';
import { Case, Category } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CasesTabProps {
  cases: Case[];
  clientId: string;
  clientCategory: Category;
  addCase: (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Case>;
  updateCase: (caseData: Case) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
}

export const CasesTab = ({ 
  cases, 
  clientId, 
  clientCategory, 
  addCase, 
  updateCase, 
  deleteCase 
}: CasesTabProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  const handleAddCase = async (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addCase(caseData);
    setIsFormOpen(false);
  };

  const handleUpdateCase = async (caseData: Case) => {
    await updateCase(caseData);
    setEditingCase(null);
  };

  const handleDeleteCase = async (id: string) => {
    await deleteCase(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Atendimentos</h3>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Atendimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Atendimento</DialogTitle>
            </DialogHeader>
            <CaseForm
              clientId={clientId}
              clientCategory={clientCategory}
              onSubmit={handleAddCase}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {cases.length > 0 ? (
        <div className="grid gap-4">
          {cases.map((caseItem) => (
            <CaseCard
              key={caseItem.id}
              case={caseItem}
              onEdit={setEditingCase}
              onDelete={handleDeleteCase}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhum atendimento cadastrado para este cliente.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Atendimento
            </Button>
          </CardContent>
        </Card>
      )}

      {editingCase && (
        <Dialog open={!!editingCase} onOpenChange={() => setEditingCase(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Atendimento</DialogTitle>
            </DialogHeader>
            <CaseForm
              clientId={clientId}
              clientCategory={clientCategory}
              initialData={editingCase}
              onSubmit={handleUpdateCase}
              onCancel={() => setEditingCase(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
