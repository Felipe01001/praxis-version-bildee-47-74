import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { CATEGORY_LABELS, SUBCATEGORIES } from '@/constants';
import { Category, Status } from '@/types';
import { toast } from 'sonner';

const CaseForm = () => {
  const navigate = useNavigate();
  const { clients, addCase } = usePraxisContext();
  
  const [formData, setFormData] = useState({
    clientId: '',
    category: '' as Category,
    subCategory: '',
    description: '',
    status: 'analysis' as Status
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.category) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await addCase({
        clientId: formData.clientId,
        category: formData.category,
        subCategory: formData.subCategory,
        description: formData.description,
        status: formData.status
      });
      
      toast.success('Atendimento criado com sucesso!');
      navigate('/cases');
    } catch (error) {
      toast.error('Erro ao criar atendimento');
      console.error('Error creating case:', error);
    }
  };

  const handleBack = () => {
    navigate('/cases');
  };

  return (
    <div className="space-y-6 px-0">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-praxis-text">Novo Atendimento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                >
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
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Status }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analysis">Em análise</SelectItem>
                    <SelectItem value="in-progress">Em tramitação</SelectItem>
                    <SelectItem value="delayed">Atrasado</SelectItem>
                    <SelectItem value="completed">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    category: value as Category,
                    subCategory: '' // Reset subcategory when category changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social-security">Previdenciário</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="civil">Cível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCategory">Subcategoria</Label>
                <Select 
                  value={formData.subCategory} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subCategory: value }))}
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category && SUBCATEGORIES[formData.category]?.map(sub => (
                      <SelectItem key={sub.value} value={sub.value}>
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o atendimento..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-praxis-olive hover:bg-praxis-olive/90 flex items-center gap-2">
                <Save className="h-4 w-4" />
                Salvar Atendimento
              </Button>
              <Button type="button" variant="outline" onClick={handleBack}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaseForm;