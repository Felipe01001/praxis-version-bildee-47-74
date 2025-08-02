
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Save, CheckCircle, Loader2, Calendar, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LegislationResult {
  id?: string;
  titulo: string;
  ementa?: string;
  tipo: string;
  numero?: string;
  ano?: string;
  orgao_emissor?: string;
  data_publicacao?: string;
  link_lexml: string;
  xml_bruto?: string;
}

interface LegislationResultCardProps {
  result: LegislationResult;
  isSaved?: boolean;
  onSave?: () => void;
}

export function LegislationResultCard({ result, isSaved = false, onSave }: LegislationResultCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para salvar normas.",
          variant: "destructive"
        });
        return;
      }

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('legislacoes')
        .select('id')
        .eq('user_id', user.id)
        .eq('tipo', result.tipo || '')
        .eq('numero', result.numero || '')
        .eq('ano', result.ano || '')
        .eq('titulo', result.titulo)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Norma já salva",
          description: "Esta norma já está salva em sua biblioteca.",
          variant: "default"
        });
        setSaved(true);
        return;
      }

      // Salvar nova norma
      const { error } = await supabase
        .from('legislacoes')
        .insert([{
          user_id: user.id,
          tipo: result.tipo || 'Documento',
          numero: result.numero || '',
          ano: result.ano || '',
          titulo: result.titulo,
          ementa: result.ementa || '',
          orgao_emissor: result.orgao_emissor || '',
          data_publicacao: result.data_publicacao ? new Date(result.data_publicacao).toISOString().split('T')[0] : null,
          link_lexml: result.link_lexml,
          xml_bruto: result.xml_bruto || ''
        }]);

      if (error) {
        console.error('Erro ao salvar norma:', error);
        toast({
          title: "Erro ao salvar",
          description: `Erro: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      setSaved(true);
      toast({
        title: "Norma salva!",
        description: "A norma foi salva com sucesso em sua biblioteca.",
        variant: "default"
      });

      onSave?.();

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao salvar a norma. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-tight">
            {result.titulo}
          </CardTitle>
          <div className="flex gap-2 flex-shrink-0">
            {result.tipo && (
              <Badge variant="secondary">
                {result.tipo}
              </Badge>
            )}
            {result.numero && result.ano && (
              <Badge variant="outline">
                {result.numero}/{result.ano}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {result.ementa && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.ementa}
          </p>
        )}

        {/* Metadados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {result.orgao_emissor && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span><strong>Órgão:</strong> {result.orgao_emissor}</span>
            </div>
          )}
          {result.data_publicacao && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span><strong>Data:</strong> {formatDate(result.data_publicacao)}</span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(result.link_lexml, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Ver no LexML
          </Button>

          {saved ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex items-center gap-2 text-green-600"
            >
              <CheckCircle className="h-4 w-4" />
              Salvo
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar no Supabase
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
