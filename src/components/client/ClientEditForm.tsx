
import { useState } from 'react';
import { Client, Category, Gender, MaritalStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS } from '@/constants';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';

interface ClientEditFormProps {
  client: Client;
  onSave: (updatedClient: Client) => void;
  onCancel: () => void;
}

export const ClientEditForm = ({ client, onSave, onCancel }: ClientEditFormProps) => {
  const [formData, setFormData] = useState<any>({
    ...client,
    rg: client.rg || { number: '', issuingBody: '' },
    address: client.address || {
      zipCode: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: ''
    },
    respondent: client.respondent || {
      name: '',
      address: '',
      cpf: ''
    }
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...(prev[parent] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.category) newErrors.category = 'Categoria é obrigatória';
    
    // Validação de CPF melhorada para aceitar com ou sem pontuação
    if (formData.cpf) {
      // Primeiro, limpa o CPF para conter apenas dígitos
      const cpfDigits = formData.cpf.replace(/\D/g, '');
      
      // Verifica se tem 11 dígitos
      if (cpfDigits.length !== 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      }
    }
    
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
    }
    
    if (formData.phone) {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$|^\d{10,11}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Telefone inválido. Formato: (00) 00000-0000 ou 00000000000';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Corrija os erros no formulário');
      return;
    }
    
    // Formatar CPF para o formato padrão para armazenamento
    let formattedCpf = formData.cpf;
    if (formData.cpf) {
      const cpfDigits = formData.cpf.replace(/\D/g, '');
      if (cpfDigits.length === 11) {
        formattedCpf = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      
      // Atualizar o CPF no formData
      formData.cpf = formattedCpf;
    }
    
    // Create a properly typed client object
    const clientData: any = {
      id: client.id,
      name: formData.name,
      cpf: formData.cpf,
      category: formData.category as Category,
      email: formData.email || '',
      phone: formData.phone || '',
      gender: formData.gender as Gender || undefined,
      maritalStatus: formData.maritalStatus as MaritalStatus || undefined,
      nationality: formData.nationality || '',
      profession: formData.profession || '',
      birthDate: formData.birthDate || '',
      govPassword: formData.govPassword || '',
      status: formData.status || 'active',
      // Add these fields to match the updated types
      createdAt: client.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Only add rg if number exists
    if (formData.rg?.number) {
      clientData.rg = {
        number: formData.rg.number,
        issuingBody: formData.rg.issuingBody || ''
      };
    }
    
    // Only add address if we have some address data
    if (formData.address?.zipCode || formData.address?.street || formData.address?.number) {
      clientData.address = {
        zipCode: formData.address.zipCode || '',
        street: formData.address.street || '',
        number: formData.address.number || '',
        neighborhood: formData.address.neighborhood || '',
        city: formData.address.city || '',
        state: formData.address.state || ''
      };
    }
    
    // Only add respondent if we have some respondent data
    if (formData.respondent?.name || formData.respondent?.address || formData.respondent?.cpf) {
      clientData.respondent = {
        name: formData.respondent.name || '',
        address: formData.respondent.address || '',
        cpf: formData.respondent.cpf || ''
      };
    }
    
    try {
      onSave(clientData);
      toast.success('Cliente atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar cliente');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Editar Cliente</h2>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            size="sm" 
            className="bg-praxis-olive hover:bg-praxis-olive/90 flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="contact">Contato e Endereço</TabsTrigger>
          <TabsTrigger value="respondent">Dados do Requerido</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome completo"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="cpf" className="text-sm font-medium">
                CPF <span className="text-destructive">*</span>
              </label>
              <Input
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                className={errors.cpf ? 'border-destructive' : ''}
              />
              {errors.cpf && (
                <p className="text-xs text-destructive">{errors.cpf}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Categoria <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value as Category)}
              >
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social-security">Previdenciário</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="civil">Cível</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="birthDate" className="text-sm font-medium">
                Data de Nascimento
              </label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium">
                Gênero
              </label>
              <Select
                value={formData.gender || ''}
                onValueChange={(value) => handleSelectChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="maritalStatus" className="text-sm font-medium">
                Estado Civil
              </label>
              <Select
                value={formData.maritalStatus || ''}
                onValueChange={(value) => handleSelectChange('maritalStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado civil" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="nationality" className="text-sm font-medium">
                Nacionalidade
              </label>
              <Input
                id="nationality"
                name="nationality"
                value={formData.nationality || ''}
                onChange={handleInputChange}
                placeholder="Nacionalidade"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="profession" className="text-sm font-medium">
                Profissão
              </label>
              <Input
                id="profession"
                name="profession"
                value={formData.profession || ''}
                onChange={handleInputChange}
                placeholder="Profissão"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="rg.number" className="text-sm font-medium">
                RG
              </label>
              <Input
                id="rg.number"
                name="rg.number"
                value={formData.rg?.number || ''}
                onChange={handleInputChange}
                placeholder="Número do RG"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="rg.issuingBody" className="text-sm font-medium">
                Órgão Emissor
              </label>
              <Input
                id="rg.issuingBody"
                name="rg.issuingBody"
                value={formData.rg?.issuingBody || ''}
                onChange={handleInputChange}
                placeholder="Órgão emissor"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="govPassword" className="text-sm font-medium">
                Senha do GOV
              </label>
              <Input
                id="govPassword"
                name="govPassword"
                type="password"
                value={formData.govPassword || ''}
                onChange={handleInputChange}
                placeholder="Senha do GOV"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Telefone
              </label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                placeholder="email@exemplo.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="address.zipCode" className="text-sm font-medium">
                CEP
              </label>
              <Input
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address?.zipCode || ''}
                onChange={handleInputChange}
                placeholder="00000-000"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="address.street" className="text-sm font-medium">
                Rua
              </label>
              <Input
                id="address.street"
                name="address.street"
                value={formData.address?.street || ''}
                onChange={handleInputChange}
                placeholder="Rua/Avenida"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="address.number" className="text-sm font-medium">
                Número
              </label>
              <Input
                id="address.number"
                name="address.number"
                value={formData.address?.number || ''}
                onChange={handleInputChange}
                placeholder="Número"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="address.neighborhood" className="text-sm font-medium">
                Bairro
              </label>
              <Input
                id="address.neighborhood"
                name="address.neighborhood"
                value={formData.address?.neighborhood || ''}
                onChange={handleInputChange}
                placeholder="Bairro"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="address.city" className="text-sm font-medium">
                Cidade
              </label>
              <Input
                id="address.city"
                name="address.city"
                value={formData.address?.city || ''}
                onChange={handleInputChange}
                placeholder="Cidade"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="address.state" className="text-sm font-medium">
                Estado
              </label>
              <Input
                id="address.state"
                name="address.state"
                value={formData.address?.state || ''}
                onChange={handleInputChange}
                placeholder="Estado"
                maxLength={2}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="respondent" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="respondent.name" className="text-sm font-medium">
                Nome do Requerido
              </label>
              <Input
                id="respondent.name"
                name="respondent.name"
                value={formData.respondent?.name || ''}
                onChange={handleInputChange}
                placeholder="Nome do requerido"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="respondent.cpf" className="text-sm font-medium">
                CPF do Requerido
              </label>
              <Input
                id="respondent.cpf"
                name="respondent.cpf"
                value={formData.respondent?.cpf || ''}
                onChange={handleInputChange}
                placeholder="CPF do requerido (opcional)"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="respondent.address" className="text-sm font-medium">
                Endereço do Requerido
              </label>
              <Input
                id="respondent.address"
                name="respondent.address"
                value={formData.respondent?.address || ''}
                onChange={handleInputChange}
                placeholder="Endereço completo do requerido"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
};
