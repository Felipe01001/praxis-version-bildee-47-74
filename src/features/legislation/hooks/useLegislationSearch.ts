
import { useState, useCallback } from 'react';
import { LegislationSearchParams, LegislationSearchResult } from '../types/legislation';
import { LexMLApi } from '../services/lexmlApi';
import { toast } from '@/hooks/use-toast';

interface ExtendedLegislationSearchResult extends LegislationSearchResult {
  searchQuery?: string;
  searchType?: string;
  executionTime?: number;
}

export const useLegislationSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ExtendedLegislationSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const search = useCallback(async (params: LegislationSearchParams) => {
    if (!params.query.trim()) {
      setError('Por favor, digite um termo para buscar');
      toast({
        title: "Campo obrigatório",
        description: "Digite um termo para realizar a busca",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastQuery(params.query);
    
    // Adicionar análise da consulta para melhor UX
    const queryAnalysis = LexMLApi.analyzeQuery(params.query);
    console.log('Query analysis:', queryAnalysis);

    try {
      console.log('useLegislationSearch: Starting search for:', params.query);
      
      const startTime = Date.now();
      const result = await LexMLApi.search(params);
      const searchTime = Date.now() - startTime;
      
      console.log(`useLegislationSearch: Search completed in ${searchTime}ms with ${result.results.length} results`);
      
      setResults(result as ExtendedLegislationSearchResult);
      
      // Adicionar à história de buscas
      setSearchHistory(prev => {
        const newHistory = [params.query, ...prev.filter(q => q !== params.query)];
        return newHistory.slice(0, 10); // Manter apenas 10 buscas recentes
      });
      
      // Toast de sucesso
      toast({
        title: "Busca realizada com sucesso",
        description: `${result.totalCount} resultado${result.totalCount !== 1 ? 's' : ''} encontrado${result.totalCount !== 1 ? 's' : ''} em ${result.executionTime || searchTime}ms`,
      });
      
    } catch (err) {
      console.error('useLegislationSearch: Search error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao realizar busca';
      setError(errorMessage);
      setResults(null);
      
      // Sugerir alternativas se possível
      const suggestions = LexMLApi.buildSearchSuggestions(params.query);
      let description = errorMessage;
      
      if (suggestions.length > 0) {
        description += `. Tente: ${suggestions.slice(0, 2).join(', ')}`;
      }
      
      toast({
        title: "Erro na busca",
        description,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchMore = useCallback(async (page: number) => {
    if (!lastQuery || !results) return;

    const params: LegislationSearchParams = {
      query: lastQuery,
      startRecord: ((page - 1) * (results.results.length / results.currentPage)) + 1,
      maxRecords: results.results.length / results.currentPage
    };

    try {
      setIsLoading(true);
      const newResults = await LexMLApi.search(params);
      
      setResults(prev => ({
        ...newResults,
        results: [...(prev?.results || []), ...newResults.results],
        currentPage: page
      }));
      
      toast({
        title: "Mais resultados carregados",
        description: `${newResults.results.length} novos resultados adicionados`
      });
      
    } catch (err) {
      console.error('Error loading more results:', err);
      toast({
        title: "Erro ao carregar mais resultados",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [lastQuery, results]);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setIsLoading(false);
    setLastQuery('');
  }, []);

  const retry = useCallback(() => {
    if (lastQuery) {
      search({ query: lastQuery });
    }
  }, [lastQuery, search]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    toast({
      title: "Histórico limpo",
      description: "Histórico de buscas foi removido"
    });
  }, []);

  return {
    search,
    searchMore,
    reset,
    retry,
    clearHistory,
    isLoading,
    results,
    error,
    lastQuery,
    searchHistory,
    hasMore: results ? results.currentPage < results.totalPages : false
  };
};
