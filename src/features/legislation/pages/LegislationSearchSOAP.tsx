import { useState } from 'react';
import { LegislationSearchForm } from '../components/LegislationSearchForm';
import { LegislationSOAPResults } from '../components/LegislationSOAPResults';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchParams {
  tipo?: string;
  numero?: string;
  ano?: string;
  query?: string;
}

interface LegislationResult {
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

export default function LegislationSearchSOAP() {
  const [results, setResults] = useState<LegislationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [executionTime, setExecutionTime] = useState<number | undefined>();
  const { toast } = useToast();

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    const startTime = Date.now();

    try {
      console.log('Iniciando busca SOAP:', params);
      
      // Determinar query para display
      let displayQuery = '';
      if (params.query) {
        displayQuery = params.query;
      } else {
        const parts = [params.tipo, params.numero, params.ano].filter(Boolean);
        displayQuery = parts.join(' ');
      }
      setSearchQuery(displayQuery);

      // Fazer chamada para a edge function
      const { data, error: supabaseError } = await supabase.functions.invoke('lexml-search', {
        body: params
      });

      if (supabaseError) {
        throw new Error(`Erro na busca SOAP: ${supabaseError.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResults(data.results || []);
      setExecutionTime(Date.now() - startTime);

      toast({
        title: "Busca realizada com sucesso",
        description: `${data.results?.length || 0} resultado(s) encontrado(s)`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na busca SOAP:', err);
      
      toast({
        title: "Erro na busca",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    // Callback para quando uma norma é salva
    toast({
      title: "Norma salva!",
      description: "A norma foi adicionada à sua biblioteca.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Busca de Legislação
        </h1>
        <p className="text-muted-foreground">
          Consulte normas jurídicas diretamente da base LexML
        </p>
      </div>

      <LegislationSearchForm 
        onSearch={handleSearch} 
        isLoading={isLoading} 
      />

      <LegislationSOAPResults
        results={results}
        isLoading={isLoading}
        error={error}
        searchQuery={searchQuery}
        executionTime={executionTime}
        onSave={handleSave}
      />
    </div>
  );
}