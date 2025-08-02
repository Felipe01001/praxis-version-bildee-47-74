
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Upload, Loader2, Phone, FileText, MapPin, Building } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BRAZILIAN_STATES, CITIES_BY_STATE } from '@/constants/locations';
import SubscriptionSection from '@/components/profile/SubscriptionSection';
import InvoicesSection from '@/components/profile/InvoicesSection';

interface UserProfile {
  id: string;
  user_id: string;
  phone: string | null;
  oab_number: string | null;
  state: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const { user, session } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [oabNumber, setOabNumber] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '');
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Get available cities based on selected state
  const availableCities = state ? CITIES_BY_STATE[state] || [] : [];
  
  // Get DDD options based on selected state
  const getStateDDD = () => {
    const selectedState = BRAZILIAN_STATES.find(s => s.code === state);
    return selectedState ? selectedState.ddd : [];
  };
  
  // Load user profile data on component mount
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);
  
  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        toast.error('Erro ao carregar perfil');
        return;
      }
      
      if (data) {
        setCpf(data.cpf || '');
        setPhone(data.phone || '');
        setOabNumber(data.oab_number || '');
        setState(data.state || '');
        setCity(data.city || '');
      }
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset city when state changes
  useEffect(() => {
    setCity('');
  }, [state]);
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (fullName) {
      const nameParts = fullName.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    
    if (email) {
      return email[0].toUpperCase();
    }
    
    return 'U';
  };
  
  // Format phone number with mask
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };
  
  // Format CPF with mask
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
  
  // Handle CPF input change
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  // Handle OAB input change
  const handleOabChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\/[A-Z]{2}$/, ''); // Remove existing state suffix
    const formatted = formatOAB(value);
    setOabNumber(formatted);
  };
  
  // Handle file selection for avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Preview the image
      const imageUrl = URL.createObjectURL(file);
      setAvatarUrl(imageUrl);
      setNewAvatarFile(file);
    }
  };

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (): Promise<string | null> => {
    if (!newAvatarFile) return avatarUrl;
    
    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = newAvatarFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newAvatarFile);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      return publicURL.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Save profile changes
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Upload avatar if a new one was selected
      let finalAvatarUrl = avatarUrl;
      if (newAvatarFile) {
        finalAvatarUrl = await uploadAvatar() || avatarUrl;
      }
      
      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        email: email !== user?.email ? email : undefined,
        data: {
          full_name: fullName,
          avatar_url: finalAvatarUrl,
        },
      });
      
      if (authError) throw authError;
      
      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          cpf: cpf || null,
          phone: phone,
          oab_number: oabNumber || null,
          state: state || null,
          city: city || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);
      
      if (profileError) throw profileError;
      
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl py-10 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editar Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e profissionais
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Avatar className="h-24 w-24 border-2 border-gray-200">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-praxis-olive text-white text-xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center space-x-2">
                    <Label 
                      htmlFor="avatar"
                      className="flex items-center space-x-2 cursor-pointer text-sm text-praxis-olive hover:text-praxis-olive/80"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Alterar foto</span>
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={uploading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu-email@exemplo.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="cpf"
                      value={cpf}
                      onChange={handleCpfChange}
                      className="pl-9"
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger className="pl-9">
                          <SelectValue placeholder="Selecione o estado" />
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
                          <SelectValue placeholder={state ? "Selecione a cidade" : "Primeiro selecione o estado"} />
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
                      <span className="text-sm text-gray-500 ml-2">
                        (DDD: {getStateDDD().join(', ')})
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="phone"
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
                      <span className="text-sm text-gray-500 ml-2">
                        (Formato: 123456/{state})
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="oabNumber"
                      value={oabNumber}
                      onChange={handleOabChange}
                      className="pl-9"
                      placeholder={state ? `123456/${state}` : "Primeiro selecione o estado"}
                      disabled={!state}
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={saving || uploading}>
                  {(saving || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar alterações
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        <div className="space-y-6">
          <SubscriptionSection />
          <InvoicesSection />
        </div>
      </div>
    </div>
  );
};

export default Profile;
