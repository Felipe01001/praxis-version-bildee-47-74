import { supabase } from '@/integrations/supabase/client';
import { LegislationSearchParams, LegislationSearchResult, QueryAnalysis } from '../types/legislation';

export class LexMLApi {
  static async search(params: LegislationSearchParams): Promise<LegislationSearchResult> {
    try {
      console.log('LexMLApi: Making SRU request to edge function with params:', params);
      
      const { data, error } = await supabase.functions.invoke('lexml-search', {
        body: params
      });

      if (error) {
        console.error('LexMLApi: Supabase function error:', error);
        throw new Error(`Erro na consulta SRU: ${error.message}`);
      }

      if (!data) {
        console.error('LexMLApi: No data returned from SRU function');
        throw new Error('Nenhum dado retornado pela API SRU');
      }

      // Verificar se é um erro da API
      if (data.error) {
        console.error('LexMLApi: SRU API returned error:', data.error);
        
        // Se há sugestões, incluir no erro
        if (data.suggestions?.length > 0) {
          const suggestionsText = data.suggestions.join('; ');
          throw new Error(`${data.error}. Sugestões: ${suggestionsText}`);
        }
        
        throw new Error(data.error);
      }

      console.log('LexMLApi: Received SRU response with', data.results?.length || 0, 'results');
      
      // Validate response structure
      if (!Array.isArray(data.results)) {
        console.error('LexMLApi: Invalid SRU response structure:', data);
        throw new Error('Formato de resposta inválido da API SRU');
      }

      // Calcular estatísticas por categoria
      const leis = data.results.filter((doc: any) => doc.categoria === 'lei');
      const jurisprudencias = data.results.filter((doc: any) => doc.categoria === 'jurisprudencia');
      const outros = data.results.filter((doc: any) => doc.categoria === 'outros');

      return {
        results: data.results,
        totalCount: data.totalCount || data.results.length,
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        searchQuery: data.searchQuery,
        searchType: data.searchType,
        executionTime: data.executionTime,
        totalLeis: leis.length,
        totalJurisprudencia: jurisprudencias.length,
        totalOutros: outros.length
      } as LegislationSearchResult;

    } catch (error) {
      console.error('LexMLApi: SRU Search error:', error);
      
      if (error instanceof Error) {
        // Re-throw with more user-friendly message for specific errors
        if (error.message.includes('fetch')) {
          throw new Error('Erro de conexão com a API SRU LexML. Verifique sua conexão com a internet.');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Tempo limite excedido. A API SRU LexML pode estar sobrecarregada. Tente novamente.');
        }
        if (error.message.includes('500')) {
          throw new Error('Erro interno da API SRU LexML. Tente novamente em alguns instantes.');
        }
        throw error;
      }
      
      throw new Error('Erro inesperado ao consultar a legislação via SRU');
    }
  }

  static async searchByUrn(urn: string): Promise<LegislationSearchResult> {
    if (!this.validateUrn(urn)) {
      throw new Error('URN inválida fornecida');
    }

    return this.search({
      query: urn,
      maxRecords: 1,
      searchType: 'specific_term'
    });
  }

  static validateUrn(urn: string): boolean {
    if (!urn || typeof urn !== 'string') {
      return false;
    }

    // Basic URN validation for LexML format
    const urnRegex = /^urn:lex:[a-z]{2}(:[a-z0-9\-\.]+)*:[a-z]+:\d{4}-\d{2}-\d{2};[\w\-\.]+$/i;
    return urnRegex.test(urn);
  }

  static formatCitation(doc: any): string {
    if (!doc) return '';
    
    const { title, date, authority, type, numero, ano } = doc;
    const parts = [];
    
    if (type && numero && ano) {
      parts.push(`${type} nº ${numero}/${ano}`);
    } else if (type && title) {
      parts.push(type, title);
    } else if (title) {
      parts.push(title);
    }
    
    if (authority) parts.push(authority);
    if (date) parts.push(date);
    
    return parts.join(', ') + '.';
  }

  static extractDocumentNumber(title: string): string | null {
    if (!title) return null;
    
    // Extract law numbers from titles like "Lei nº 8.078" or "Lei 8078"
    const numberMatch = title.match(/(?:lei|decreto|portaria)\s*n?º?\s*(\d+(?:\.\d+)*)/i);
    return numberMatch ? numberMatch[1] : null;
  }

  static buildSearchSuggestions(query: string): string[] {
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Add specific suggestions based on query analysis
    if (queryLower.includes('lei')) {
      const number = this.extractDocumentNumber(query);
      if (number) {
        suggestions.push(`Lei ${number}`);
        suggestions.push(`Lei nº ${number}`);
        // Try adding common years
        ['2023', '2022', '2021', '2020', '1990'].forEach(year => {
          suggestions.push(`Lei ${number}/${year}`);
        });
      }
    }
    
    // Add variations with accents and without
    if (queryLower.includes('constituicao')) {
      suggestions.push('Constituição Federal');
    }
    if (queryLower.includes('codigo')) {
      suggestions.push('Código Civil', 'Código Penal');
    }
    
    // Add common law suggestions based on partial matches
    const commonLaws = [
      { terms: ['consumidor', 'cdc'], suggestion: 'Lei 8078 (CDC)' },
      { terms: ['civil'], suggestion: 'Código Civil' },
      { terms: ['penal'], suggestion: 'Código Penal' },
      { terms: ['clt', 'trabalho'], suggestion: 'CLT' },
      { terms: ['constituição', 'constituicao'], suggestion: 'Constituição Federal' },
      { terms: ['criança', 'adolescente'], suggestion: 'Estatuto da Criança e do Adolescente' },
      { terms: ['maria', 'penha'], suggestion: 'Lei Maria da Penha' }
    ];
    
    commonLaws.forEach(({ terms, suggestion }) => {
      if (terms.some(term => queryLower.includes(term))) {
        suggestions.push(suggestion);
      }
    });
    
    return [...new Set(suggestions)].slice(0, 5); // Remove duplicates and limit
  }

  // Método para análise de consulta
  static analyzeQuery(query: string): QueryAnalysis {
    const cleanQuery = query.trim().toLowerCase();
    
    // Detectar número de lei com ano
    const lawWithYearMatch = cleanQuery.match(/(?:lei\s+)?(?:n[ºo°]?\s*)?(\d+)[\/\-](\d{4})/);
    if (lawWithYearMatch) {
      return {
        type: 'law_number',
        lawNumber: lawWithYearMatch[1],
        year: lawWithYearMatch[2],
        terms: [cleanQuery],
        confidence: 0.95
      };
    }

    // Detectar número de lei sem ano
    const lawNumberMatch = cleanQuery.match(/(?:lei\s+)?(?:n[ºo°]?\s*)?(\d+)(?!\d)/);
    if (lawNumberMatch) {
      return {
        type: 'law_number',
        lawNumber: lawNumberMatch[1],
        terms: [cleanQuery],
        confidence: 0.85
      };
    }

    // Detectar documentos específicos conhecidos
    const specificDocs = [
      'constituição', 'constituicao', 'código civil', 'codigo civil', 
      'cdc', 'clt', 'estatuto da criança', 'marco civil da internet'
    ];
    
    if (specificDocs.some(doc => cleanQuery.includes(doc))) {
      return {
        type: 'specific_document',
        terms: [cleanQuery],
        confidence: 0.9
      };
    }

    // Busca geral por termos
    return {
      type: 'general_term',
      terms: cleanQuery.split(/\s+/).filter(t => t.length > 2),
      confidence: 0.7
    };
  }
}
