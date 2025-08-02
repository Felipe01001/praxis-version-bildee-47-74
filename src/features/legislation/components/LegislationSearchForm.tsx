
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';

interface LegislationSearchFormProps {
  onSearch: (params: {
    tipo?: string;
    numero?: string;
    ano?: string;
    query?: string;
  }) => void;
  isLoading?: boolean;
}

const tiposNorma = [
  { value: '', label: 'Todos os tipos' },
  { value: 'lei', label: 'Lei' },
  { value: 'decreto', label: 'Decreto' },
  { value: 'resolucao', label: 'Resolução' },
  { value: 'portaria', label: 'Portaria' },
  { value: 'instrucao_normativa', label: 'Instrução Normativa' },
  { value: 'medida_provisoria', label: 'Medida Provisória' },
  { value: 'constituicao', label: 'Constituição' },
  { value: 'emenda_constitucional', label: 'Emenda Constitucional' }
];

export function LegislationSearchForm({ onSearch, isLoading = false }: LegislationSearchFormProps) {
  const [tipo, setTipo] = useState('');
  const [numero, setNumero] = useState('');
  const [ano, setAno] = useState('');
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'specific' | 'general'>('specific');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchMode === 'specific') {
      // Busca específica por tipo, número e ano
      if (!numero?.trim()) {
        alert('Por favor, informe o número da norma para busca específica.');
        return;
      }
      onSearch({ tipo, numero: numero.trim(), ano: ano.trim() });
    } else {
      // Busca geral por texto
      if (!query?.trim()) {
        alert('Por favor, informe um termo para busca geral.');
        return;
      }
      onSearch({ query: query.trim() });
    }
  };

  const clearForm = () => {
    setTipo('');
    setNumero('');
    setAno('');
    setQuery('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Busca de Legislação - LexML
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Modo de busca */}
          <div className="flex gap-4 mb-4">
            <Button
              type="button"
              variant={searchMode === 'specific' ? 'default' : 'outline'}
              onClick={() => setSearchMode('specific')}
              className="flex-1"
            >
              Busca Específica
            </Button>
            <Button
              type="button"
              variant={searchMode === 'general' ? 'default' : 'outline'}
              onClick={() => setSearchMode('general')}
              className="flex-1"
            >
              Busca Geral
            </Button>
          </div>

          {searchMode === 'specific' ? (
            // Busca específica por tipo, número e ano
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo da Norma</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposNorma.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número da Norma</Label>
                <Input
                  id="numero"
                  type="text"
                  placeholder="Ex: 8078"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ano">Ano da Norma</Label>
                <Input
                  id="ano"
                  type="number"
                  placeholder="Ex: 1990"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                />
              </div>
            </div>
          ) : (
            // Busca geral por texto
            <div className="space-y-2">
              <Label htmlFor="query">Busca Geral</Label>
              <Input
                id="query"
                type="text"
                placeholder="Ex: Código de Defesa do Consumidor, Lei Maria da Penha, etc."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Digite qualquer termo, número de lei, ou nome popular da norma
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={clearForm}
              disabled={isLoading}
            >
              Limpar
            </Button>
          </div>

          {/* Dicas de uso */}
          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">💡 Dicas de busca:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Busca específica:</strong> Use quando souber o tipo e número exato da norma</li>
              <li>• <strong>Busca geral:</strong> Use termos como "consumidor", "maria da penha", "CLT", etc.</li>
              <li>• <strong>Exemplos:</strong> "Lei 8078", "Código Civil", "Estatuto da Criança"</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
