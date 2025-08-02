import { LegislationResultCard } from './LegislationResultCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface LegislationSOAPResultsProps {
  results: LegislationResult[];
  isLoading?: boolean;
  error?: string | null;
  searchQuery?: string;
  executionTime?: number;
  onSave?: () => void;
}

export function LegislationSOAPResults({ 
  results = [], 
  isLoading = false, 
  error = null, 
  searchQuery = '',
  executionTime,
  onSave 
}: LegislationSOAPResultsProps) {
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Buscando na base LexML...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Erro na busca:</strong> {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 
              `Não foram encontrados resultados para "${searchQuery}". Tente refinar sua busca.` :
              'Execute uma busca para ver os resultados da legislação.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultados da Busca
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </Badge>
              {executionTime && (
                <Badge variant="outline">
                  {executionTime}ms
                </Badge>
              )}
            </div>
          </CardTitle>
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              Busca por: <strong>"{searchQuery}"</strong>
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Lista de resultados */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <LegislationResultCard
            key={`${result.titulo}-${index}`}
            result={result}
            onSave={onSave}
          />
        ))}
      </div>

      {/* Footer com informações */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Dados obtidos da API LexML - Rede de Informação Legislativa e Jurídica
          </p>
        </CardContent>
      </Card>
    </div>
  );
}