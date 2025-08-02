
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Loader2, User, Mail, Phone, FileText, MapPin, Building } from 'lucide-react';
import { BRAZILIAN_STATES, CITIES_BY_STATE } from '@/constants/locations';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [oabNumber, setOabNumber] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  // Get available cities based on selected state
  const availableCities = state ? CITIES_BY_STATE[state] || [] : [];
  
  // Get DDD options based on selected state
  const getStateDDD = () => {
    const selectedState = BRAZILIAN_STATES.find(s => s.code === state);
    return selectedState ? selectedState.ddd : [];
  };

  // Format phone number with mask
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };
  
  // Format OAB number with state suffix
  const formatOAB = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers && state) {
      return `${numbers}/${state}`;
    }
    return numbers;
  };
  
  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };
  
  // Handle OAB input change
  const handleOabChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\/[A-Z]{2}$/, ''); // Remove existing state suffix
    const formatted = formatOAB(value);
    setOabNumber(formatted);
  };

  // Reset city and OAB when state changes
  const handleStateChange = (newState: string) => {
    setState(newState);
    setCity('');
    // Update OAB number format if it exists
    if (oabNumber) {
      const numbers = oabNumber.replace(/\D/g, '');
      setOabNumber(numbers ? `${numbers}/${newState}` : '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error('Por favor, preencha seu nome completo');
      return;
    }
    
    if (!email.trim()) {
      toast.error('Por favor, preencha seu e-mail');
      return;
    }
    
    if (!password.trim()) {
      toast.error('Por favor, preencha sua senha');
      return;
    }
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            state: state,
            city: city,
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este e-mail já está cadastrado. Tente fazer login.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Conta criada com sucesso! Verifique seu e-mail para confirmar sua conta.');
      navigate('/auth/verify-email');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-praxis-olive/10 to-praxis-olive/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-praxis-olive">
            Criar conta
          </CardTitle>
          <CardDescription className="text-center">
            Preencha os dados abaixo para se cadastrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="seu-email@exemplo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9"
                  placeholder="Sua senha (mín. 6 caracteres)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                  <Select value={state} onValueChange={handleStateChange}>
                    <SelectTrigger className="pl-9">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((stateOption) => (
                        <SelectItem key={stateOption.code} value={stateOption.code}>
                          {stateOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                  <Select value={city} onValueChange={setCity} disabled={!state}>
                    <SelectTrigger className="pl-9">
                      <SelectValue placeholder={state ? "Cidade" : "Selecione estado"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((cityOption) => (
                        <SelectItem key={cityOption} value={cityOption}>
                          {cityOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Celular
                {state && getStateDDD().length > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    (DDD: {getStateDDD().join(', ')})
                  </span>
                )}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="pl-9"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oabNumber">
                Número da OAB (opcional)
                {state && (
                  <span className="text-xs text-gray-500 ml-1">
                    (Formato: 123456/{state})
                  </span>
                )}
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="oabNumber"
                  type="text"
                  value={oabNumber}
                  onChange={handleOabChange}
                  className="pl-9"
                  placeholder={state ? `123456/${state}` : "Selecione o estado primeiro"}
                  disabled={!state}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar conta
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link to="/auth/login" className="text-praxis-olive hover:underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
