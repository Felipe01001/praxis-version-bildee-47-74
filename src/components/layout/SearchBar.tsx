
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { usePraxisContext } from '@/context/PraxisContext';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from 'sonner';

export const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { clients } = usePraxisContext();

  const handleSearch = async () => {
    if (searchTerm.trim() === '') return;
    
    setIsSearching(true);
    setResults([]);
    
    try {
      // Buscar clientes localmente
      const clientResults = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf.includes(searchTerm)
      ).map(client => ({
        type: 'client',
        id: client.id,
        title: client.name,
        description: `CPF: ${client.cpf}`
      }));
      
      // Buscar processos judiciais via DataJud API
      let judicialResults: any[] = [];
      
      // Verificar se o termo de pesquisa é um número de processo (usando uma validação simples)
      if (/^\d{20}$/.test(searchTerm.replace(/[^0-9]/g, ''))) {
        const processNumber = searchTerm.replace(/[^0-9]/g, '');
        try {
          const { data, error } = await supabase.functions.invoke('datajud', {
            body: { 
              processNumber,
              tribunal: 'trf1' // Usando TRF1 como padrão para simplificar
            }
          });
          
          if (error) throw new Error(error.message);
          
          if (data && data.hits && data.hits.hits && data.hits.hits.length > 0) {
            judicialResults = data.hits.hits.map((hit: any) => ({
              type: 'judicial',
              id: hit._id,
              title: `Processo Nº ${hit._source.numeroProcesso}`,
              description: hit._source.orgaoJulgador?.nome || 'Processo Judicial'
            }));
          }
        } catch (err) {
          console.error('Erro ao buscar processo judicial:', err);
        }
      }
      
      setResults([...clientResults, ...judicialResults]);
      
      if (clientResults.length === 0 && judicialResults.length === 0) {
        toast.info('Nenhum resultado encontrado');
      } else {
        setOpen(true);
      }
    } catch (error) {
      console.error('Erro na pesquisa:', error);
      toast.error('Erro ao realizar a pesquisa');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleItemClick = (item: any) => {
    setOpen(false);
    
    if (item.type === 'client') {
      navigate(`/clients/${item.id}`);
    } else if (item.type === 'judicial') {
      // Para processos judiciais, podemos direcionar para uma página ou mostrar detalhes
      navigate(`/search?process=${item.id}`);
      toast.info('Abrindo detalhes do processo judicial');
    }
  };

  return (
    <>
      <div className="relative flex w-full max-w-md items-center">
        <Search className="absolute left-3 text-white opacity-70 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar cliente, CPF, processo judicial..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 w-full bg-white/10 border-none text-white placeholder:text-white/70 focus:bg-white/20"
        />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSearch} 
          disabled={isSearching}
          className="absolute right-0 text-white hover:bg-white/20"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Pesquisar</span>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Refinar sua busca..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {results.length > 0 && (
            <>
              {results.some(item => item.type === 'client') && (
                <CommandGroup heading="Clientes">
                  {results
                    .filter(item => item.type === 'client')
                    .map((item) => (
                      <CommandItem 
                        key={item.id}
                        onSelect={() => handleItemClick(item)}
                      >
                        <div>
                          <p>{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )}
              
              {results.some(item => item.type === 'judicial') && (
                <CommandGroup heading="Processos Judiciais">
                  {results
                    .filter(item => item.type === 'judicial')
                    .map((item) => (
                      <CommandItem 
                        key={item.id}
                        onSelect={() => handleItemClick(item)}
                      >
                        <div>
                          <p>{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
