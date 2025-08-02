
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Case, Category, Status } from '@/types';

interface CaseFormProps {
  clientId: string;
  clientCategory: Category;
  initialData?: Case;
  onSubmit: (caseData: Case | Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const CaseForm = ({ clientId, clientCategory, initialData, onSubmit, onCancel }: CaseFormProps) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || 'in-progress');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const caseData = {
      ...(initialData?.id && { id: initialData.id }),
      clientId,
      category: clientCategory,
      description: description || null,
      status,
      subCategory: subCategory || null,
      ...(initialData?.createdAt && { createdAt: initialData.createdAt }),
      ...(initialData?.updatedAt && { updatedAt: initialData.updatedAt }),
      endDate: null, // Campo de data sempre null inicialmente
      caseNumber: null // Campo número do caso sempre null inicialmente
    };

    console.log('Enviando dados do caso:', caseData);
    onSubmit(caseData as any);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as Status);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
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
      
      <div>
        <Label htmlFor="subCategory">Subcategoria</Label>
        <Input
          id="subCategory"
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit">
          {initialData ? 'Atualizar' : 'Criar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};
