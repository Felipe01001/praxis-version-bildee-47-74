import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePraxisContext } from '@/context/PraxisContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Category, Gender, MaritalStatus, ClientStatus } from '@/types';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

const ClientForm = () => {
  const navigate = useNavigate();
  const { addClient } = usePraxisContext();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    category: '' as Category,
    phone: '',
    email: '',
    birthDate: '',
    gender: '' as Gender | '',
    maritalStatus: '' as MaritalStatus | '',
    nationality: '',
    profession: '',
    rgNumber: '',
    rgIssuingBody: '',
    addressStreet: '',
    addressNumber: '',
    addressNeighborhood: '',
    addressCity: '',
    addressState: '',
    addressZipCode: '',
    respondentName: '',
    respondentAddress: '',
    respondentCpf: '',
    govPassword: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.category) newErrors.category = 'Categoria é obrigatória';
    
    // CPF validation is now optional, but still validate format if provided
    if (formData.cpf) {
      // First, clean the CPF to contain only digits
      const cpfDigits = formData.cpf.replace(/\D/g, '');
      
      // Check if it has 11 digits
      if (cpfDigits.length !== 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      }
    }
    
    // Validate email format if provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
    }
    
    // Validate phone format if provided
    if (formData.phone) {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$|^\d{10,11}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Telefone inválido. Formato: (00) 00000-0000 ou 00000000000';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para cadastrar um cliente');
      navigate('/auth');
      return;
    }
    
    if (!validateForm()) {
      toast.error('Corrija os erros no formulário');
      return;
    }
    
    console.log('Iniciando cadastro de cliente...');
    console.log('Usuário logado:', user.id);
    console.log('Dados do formulário:', formData);
    
    // Format CPF for storage if provided
    let formattedCpf = formData.cpf;
    if (formData.cpf) {
      const cpfDigits = formData.cpf.replace(/\D/g, '');
      if (cpfDigits.length === 11) {
        formattedCpf = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    }
    
    // Create client object with the form data
    const clientData: any = {
      name: formData.name,
      cpf: formattedCpf || '',
      category: formData.category as Category,
      phone: formData.phone || null,
      email: formData.email || null,
      birthDate: formData.birthDate || null,
      gender: formData.gender as Gender || null,
      maritalStatus: formData.maritalStatus as MaritalStatus || null,
      nationality: formData.nationality || null,
      profession: formData.profession || null,
      govPassword: formData.govPassword || null,
      status: 'active' as ClientStatus
    };
    
    // Add RG if number exists
    if (formData.rgNumber) {
      clientData.rg = {
        number: formData.rgNumber,
        issuingBody: formData.rgIssuingBody || null
      };
    } else {
      clientData.rg = {
        number: null,
        issuingBody: null
      };
    }
    
    // Add address - ensure all required properties are present
    clientData.address = {
      street: formData.addressStreet || null,
      number: formData.addressNumber || null,
      zipCode: formData.addressZipCode || null,
      neighborhood: formData.addressNeighborhood || null,
      city: formData.addressCity || null,
      state: formData.addressState || null
    };
    
    // Add respondent if we have respondent data
    if (formData.respondentName || formData.respondentAddress || formData.respondentCpf) {
      clientData.respondent = {
        name: formData.respondentName || null,
        address: formData.respondentAddress || null,
        cpf: formData.respondentCpf || null
      };
    }
    
    try {
      console.log('Dados finais para envio:', clientData);
      
      // Add client and get the created client with ID
      const newClient = await addClient(clientData);
      
      console.log('Cliente criado com sucesso:', newClient);
      toast.success('Cliente cadastrado e sincronizado com sucesso!');
      navigate(`/clients/${newClient.id}`);
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error('Erro ao cadastrar cliente. Verifique sua conexão e tente novamente.');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cadastro de Cliente</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-medium">Dados Básicos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nome Completo <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nome completo do cliente"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="cpf" className="text-sm font-medium flex items-center">
                    CPF <span className="text-muted-foreground ml-1">(recomendado)</span>
                  </label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00 ou somente números"
                    className={errors.cpf ? 'border-destructive' : ''}
                  />
                  {errors.cpf && (
                    <p className="text-xs text-destructive">{errors.cpf}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Categoria <span className="text-destructive">*</span>
                  </label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleSelectChange('category', value)}
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
                  <label htmlFor="phone" className="text-sm font-medium flex items-center">
                    Telefone <span className="text-muted-foreground ml-1">(recomendado)</span>
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium flex items-center">
                    Email <span className="text-muted-foreground ml-1">(recomendado)</span>
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@exemplo.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <Alert variant="default" className="bg-muted/50 border-muted">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  É recomendado fornecer CPF, telefone e e-mail para melhor identificação e contato com o cliente.
                </AlertDescription>
              </Alert>
            </div>
            
            {/* Botões de ação */}
            <div className="flex justify-end mt-6 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-praxis-olive hover:bg-praxis-olive/90"
              >
                Cadastrar Cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default ClientForm;
