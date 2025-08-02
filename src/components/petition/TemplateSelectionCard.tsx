import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, FileText, Loader2, AlertCircle, User, MessageSquare } from 'lucide-react';
import { usePetitionTemplates } from '@/hooks/usePetitionTemplates';
import { usePetitionGenerator } from '@/hooks/usePetitionGenerator';
import { PetitionTemplateWithFiles } from '@/types/petition-template';
import { Client, MaritalStatus } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LawyerProfile {
  id: string;
  user_id: string;
  phone: string | null;
  oab_number: string | null;
  state: string | null;
  city: string | null;
}

interface TemplateSelectionCardProps {
  selectedClientId: string;
  clients: Client[];
  onContentGenerated: (content: string, templateTitle: string) => void;
}

export const TemplateSelectionCard = ({ 
  selectedClientId, 
  clients, 
  onContentGenerated 
}: TemplateSelectionCardProps) => {
  const { templates, loading, searchTemplates } = usePetitionTemplates();
  const { generatePetition, isGenerating } = usePetitionGenerator();
  const { user } = useAuth();
  const [selectedTema, setSelectedTema] = useState<string>('');
  const [selectedSubtema, setSelectedSubtema] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<PetitionTemplateWithFiles | null>(null);
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [userDescription, setUserDescription] = useState<string>('');

  useEffect(() => {
    searchTemplates();
    loadLawyerProfile();
  }, []);

  const loadLawyerProfile = async () => {
    if (!user) return;
    
    try {
      setLoadingProfile(true);
      console.log('Carregando perfil do advogado...');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil do advogado:', error);
        toast.error('Erro ao carregar dados do advogado');
        return;
      }
      
      if (data) {
        setLawyerProfile(data);
        console.log('Perfil do advogado carregado:', data);
      } else {
        console.log('Nenhum perfil encontrado para o advogado');
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar perfil:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const temas = Array.from(new Set(templates.map(t => t.tema))).sort();
  const subtemas = selectedTema 
    ? Array.from(new Set(templates.filter(t => t.tema === selectedTema).map(t => t.subtema))).sort()
    : [];

  const filteredTemplates = templates.filter(template => {
    if (selectedTema && template.tema !== selectedTema) return false;
    if (selectedSubtema && template.subtema !== selectedSubtema) return false;
    return true;
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleGenerateWithAI = async () => {
    if (!selectedTemplate || !selectedClient) {
      toast.error('Selecione um template e um cliente para continuar');
      return;
    }

    if (!lawyerProfile) {
      toast.error('Dados do advogado não encontrados. Atualize seu perfil primeiro.');
      return;
    }

    console.log('=== INICIANDO GERAÇÃO ===');
    console.log('Template selecionado:', selectedTemplate);
    console.log('Cliente selecionado:', selectedClient);
    console.log('Descrição do usuário:', userDescription);
    console.log('Advogado:', {
      name: user?.user_metadata?.full_name,
      email: user?.email,
      profile: lawyerProfile
    });

    try {
      const completeClientData: Client = {
        ...selectedClient,
        nationality: selectedClient.nationality || 'Brasileiro(a)',
        maritalStatus: selectedClient.maritalStatus || 'single' as MaritalStatus,
        profession: selectedClient.profession || 'Não informado'
      };

      const lawyerData = {
        name: user?.user_metadata?.full_name || 'Advogado não informado',
        email: user?.email || 'Email não informado',
        phone: lawyerProfile.phone || 'Telefone não informado',
        oabNumber: lawyerProfile.oab_number || 'OAB não informada',
        state: lawyerProfile.state || 'Estado não informado',
        city: lawyerProfile.city || 'Cidade não informada'
      };

      console.log('Dados completos do cliente:', completeClientData);
      console.log('Dados do advogado:', lawyerData);

      const generatedContent = await generatePetition(
        selectedTemplate, 
        completeClientData,
        lawyerData,
        userDescription.trim() || undefined
      );
      
      if (generatedContent) {
        console.log('Petição gerada com sucesso:', generatedContent.substring(0, 200));
        // Pass the template title to auto-fill the petition title
        onContentGenerated(generatedContent, selectedTemplate.titulo);
        toast.success('Petição gerada com sucesso!', {
          description: 'Você pode visualizar e editar na aba correspondente.'
        });
      } else {
        console.error('Nenhum conteúdo foi gerado');
        toast.error('Erro na geração da petição', {
          description: 'Verifique se a API do DeepSeek está configurada e tem crédito disponível.'
        });
      }
    } catch (error) {
      console.error('Erro durante a geração:', error);
      toast.error('Erro durante a geração', {
        description: 'Verifique os logs do console para mais detalhes.'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Gerar Petição com IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo de descrição personalizada */}
        <div>
          <Label htmlFor="description" className="text-sm font-medium mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Descrição do Caso (Opcional)
          </Label>
          <Textarea
            id="description"
            placeholder="Descreva brevemente os fatos do caso para que a IA possa gerar uma petição mais específica e detalhada..."
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {userDescription.length}/500 caracteres - Esta descrição ajudará a IA a criar fatos mais específicos
          </p>
        </div>

        {/* Dados do advogado */}
        {loadingProfile ? (
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando dados do advogado...</span>
            </div>
          </div>
        ) : lawyerProfile ? (
          <div className="bg-green-50 p-3 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-900">Advogado Responsável:</p>
            </div>
            <div className="text-sm text-green-800 space-y-1">
              <p><strong>Nome:</strong> {user?.user_metadata?.full_name || 'Não informado'}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              {lawyerProfile.phone && <p><strong>Telefone:</strong> {lawyerProfile.phone}</p>}
              {lawyerProfile.oab_number && <p><strong>OAB:</strong> {lawyerProfile.oab_number}</p>}
              {lawyerProfile.city && lawyerProfile.state && (
                <p><strong>Cidade/Estado:</strong> {lawyerProfile.city}/{lawyerProfile.state}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-3 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">Atenção:</p>
            </div>
            <p className="text-sm text-amber-800">
              Complete seu perfil para incluir seus dados nas petições.
            </p>
          </div>
        )}

        {/* Filtros de tema e subtema */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tema</label>
            <Select value={selectedTema} onValueChange={(value) => {
              setSelectedTema(value);
              setSelectedSubtema(''); // Reset subtema when tema changes
              setSelectedTemplate(null); // Reset template selection
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os temas</SelectItem>
                {temas.map(tema => (
                  <SelectItem key={tema} value={tema}>{tema}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Subtema</label>
            <Select 
              value={selectedSubtema} 
              onValueChange={(value) => {
                setSelectedSubtema(value);
                setSelectedTemplate(null); // Reset template selection
              }} 
              disabled={!selectedTema}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar subtema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os subtemas</SelectItem>
                {subtemas.map(subtema => (
                  <SelectItem key={subtema} value={subtema}>{subtema}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de templates filtrados */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Templates Disponíveis ({filteredTemplates.length} encontrados)
          </label>
          <ScrollArea className="h-64 border rounded-md p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum template encontrado</p>
                {selectedTema && <p className="text-xs">Tente selecionar outro tema/subtema</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{template.titulo}</h4>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">{template.tema}</Badge>
                          <Badge variant="outline" className="text-xs">{template.subtema}</Badge>
                        </div>
                        {template.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {template.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <FileText className="h-3 w-3" />
                          <span>{template.files.length} arquivo(s)</span>
                          {template.files.some(f => f.content_text) ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Conteúdo extraído
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Sem conteúdo extraído
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Informações do cliente selecionado */}
        {selectedClient && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm font-medium text-blue-900">Cliente Selecionado:</p>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Nome:</strong> {selectedClient.name}</p>
              <p><strong>Email:</strong> {selectedClient.email}</p>
              {selectedClient.phone && <p><strong>Telefone:</strong> {selectedClient.phone}</p>}
              {selectedClient.cpf && <p><strong>CPF:</strong> {selectedClient.cpf}</p>}
              {selectedClient.rg?.number && <p><strong>RG:</strong> {selectedClient.rg.number}</p>}
              {selectedClient.profession && <p><strong>Profissão:</strong> {selectedClient.profession}</p>}
              {selectedClient.maritalStatus && <p><strong>Estado Civil:</strong> {selectedClient.maritalStatus}</p>}
              {selectedClient.address && (
                <p><strong>Endereço:</strong> {selectedClient.address.street}, {selectedClient.address.number}, {selectedClient.address.neighborhood}, {selectedClient.address.city}/{selectedClient.address.state}</p>
              )}
            </div>
          </div>
        )}

        {/* Template selecionado */}
        {selectedTemplate && (
          <div className="bg-purple-50 p-3 rounded-md">
            <p className="text-sm font-medium text-purple-900">Template Selecionado:</p>
            <p className="text-sm text-purple-800">{selectedTemplate.titulo}</p>
            <p className="text-xs text-purple-600">{selectedTemplate.tema} / {selectedTemplate.subtema}</p>
          </div>
        )}

        {/* Botão de gerar */}
        <Button
          onClick={handleGenerateWithAI}
          disabled={!selectedTemplate || !selectedClient || !lawyerProfile || isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando Petição com IA...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Petição com IA
            </>
          )}
        </Button>

        {selectedTemplate && selectedClient && lawyerProfile && !isGenerating && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>
              Será gerada uma petição baseada no template "{selectedTemplate.titulo}" 
              com os dados completos do cliente {selectedClient.name} e do advogado {user?.user_metadata?.full_name}.
            </p>
            {userDescription && (
              <p className="text-purple-600 font-medium">
                ✨ Usando descrição personalizada para gerar fatos mais específicos
              </p>
            )}
            <p>A comarca de referência será {lawyerProfile.city || 'não informada'}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
