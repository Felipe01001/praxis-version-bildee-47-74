
import { useState } from 'react';
import { LegislationSearchForm } from '../components/LegislationSearchForm';
import { LegislationTabs } from '../components/LegislationTabs';
import { useLegislationSearch } from '../hooks/useLegislationSearch';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { LegislationSearchParams } from '../types/legislation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search as SearchIcon, Clock, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';

export default function LegislationSearch() {
  const [currentQuery, setCurrentQuery] = useState('');
  
  const { 
    results, 
    isLoading, 
    error, 
    search,
    hasMore
  } = useLegislationSearch();

  const { 
    recentSearches, 
    addRecentSearch, 
    removeRecentSearch, 
    clearRecentSearches 
  } = useRecentSearches();

  const [showHistory, setShowHistory] = useState(false);

  const handleSearch = (params: LegislationSearchParams) => {
    setCurrentQuery(params.query);
    search(params);
    addRecentSearch(params);
  };

  const handleRecentSearch = (searchItem: any) => {
    const params: LegislationSearchParams = {
      query: searchItem.query,
      type: searchItem.filters?.type || 'all',
      authority: searchItem.filters?.authority || 'all'
    };
    handleSearch(params);
    setShowHistory(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Pesquisa Legislativa</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Busque leis, decretos, portarias e jurisprudência no banco de dados LexML. 
          Nova integração SOAP para resultados mais precisos e confiáveis.
        </p>
      </div>

      {/* Search Form */}
      <Card className="border-praxis-olive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-praxis-olive" />
            Buscar Legislação (API SRU)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionAccessWrapper action="pesquisar na legislação">
            <LegislationSearchForm 
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </SubscriptionAccessWrapper>
        </CardContent>
      </Card>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Buscas Recentes
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Ocultar' : 'Mostrar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {showHistory && (
            <CardContent>
              <div className="space-y-2">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleRecentSearch(search)}
                  >
                    <div className="flex items-center gap-2">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{search.query}</span>
                      <Badge variant="secondary" className="text-xs">
                        {search.displayText}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {search.timeAgo}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(search.id);
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p><strong>Erro na busca SRU:</strong> {error}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="border-praxis-olive/20">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-praxis-olive mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Consultando API SRU do LexML...</p>
                <p className="text-muted-foreground">
                  Processando sua consulta com a integração SRU
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results with Tabs */}
      {results && results.results && results.results.length > 0 && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Resultados da Busca</h2>
              <p className="text-muted-foreground">
                {results.totalCount ? `${results.totalCount.toLocaleString()} resultado${results.totalCount !== 1 ? 's' : ''} encontrado${results.totalCount !== 1 ? 's' : ''}` : `${results.results.length} resultado${results.results.length !== 1 ? 's' : ''}`}
                {results.executionTime && ` em ${results.executionTime}ms`}
              </p>
            </div>
            <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
              API SRU ✓
            </Badge>
          </div>

          {/* Tabbed Results */}
          <LegislationTabs documents={results.results} isLoading={isLoading} />

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => {/* TODO: implement load more */}}
                disabled={isLoading}
              >
                Carregar mais resultados
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results && results.results && results.results.length === 0 && currentQuery && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="py-12 text-center space-y-4">
            <SearchIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                A busca SRU não retornou documentos que correspondam aos critérios informados.
                Tente usar termos mais gerais ou verifique a ortografia.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      {!currentQuery && !isLoading && (
        <Card className="border-praxis-olive/20 bg-gradient-to-br from-praxis-olive/5 to-transparent">
          <CardContent className="py-8">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-praxis-dark">API SRU do LexML</h3>
                <p className="text-muted-foreground">
                  Integração SRU para buscas precisas e resultados categorizados
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="space-y-3 text-left">
                  <h4 className="font-medium text-praxis-dark">Vantagens da API SRU:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-praxis-olive">•</span>
                      <span><strong>Separação automática</strong> - leis e jurisprudência organizadas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-praxis-olive">•</span>
                      <span><strong>Links funcionais</strong> - acesso direto aos documentos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-praxis-olive">•</span>
                      <span><strong>Dados completos</strong> - ementa, órgão, data de publicação</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3 text-left">
                  <h4 className="font-medium text-praxis-dark">Exemplos de busca:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-praxis-olive">•</span>
                      <span><strong>"Lei 8112"</strong> - busca por número específico</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-praxis-olive">•</span>
                      <span><strong>"direito constitucional"</strong> - busca por assunto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-praxis-olive">•</span>
                      <span><strong>"STF recurso"</strong> - jurisprudência específica</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
