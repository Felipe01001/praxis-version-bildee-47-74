
import React, { useState, useMemo } from 'react';
import { JudicialProcess } from '@/types';
import {
  Clock,
  FileText,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileCheck,
  Tag,
  AlertTriangle,
  List
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface JudicialProcessTimelineProps {
  process: JudicialProcess;
  onRefresh?: () => void;
  isLoading?: boolean;
}

type MovementType = 'despacho' | 'sentenca' | 'audiencia' | 'decisao' | 'juntada' | 'peticao' | 'outros';
type MovementCategory = {
  type: MovementType;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
};

export const JudicialProcessTimeline = ({
  process,
  onRefresh,
  isLoading = false
}: JudicialProcessTimelineProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Categorias de movimentação com ícones e cores
  const moveCategories: Record<MovementType, MovementCategory> = {
    'despacho': {
      type: 'despacho',
      icon: <FileText size={16} />,
      color: 'text-blue-600',
      backgroundColor: 'bg-blue-100'
    },
    'sentenca': {
      type: 'sentenca',
      icon: <CheckCircle size={16} />,
      color: 'text-green-600',
      backgroundColor: 'bg-green-100'
    },
    'audiencia': {
      type: 'audiencia',
      icon: <Calendar size={16} />,
      color: 'text-purple-600',
      backgroundColor: 'bg-purple-100'
    },
    'decisao': {
      type: 'decisao',
      icon: <AlertCircle size={16} />,
      color: 'text-amber-600',
      backgroundColor: 'bg-amber-100'
    },
    'juntada': {
      type: 'juntada',
      icon: <FileCheck size={16} />,
      color: 'text-cyan-600',
      backgroundColor: 'bg-cyan-100'
    },
    'peticao': {
      type: 'peticao',
      icon: <Tag size={16} />,
      color: 'text-indigo-600',
      backgroundColor: 'bg-indigo-100'
    },
    'outros': {
      type: 'outros',
      icon: <HelpCircle size={16} />,
      color: 'text-gray-600',
      backgroundColor: 'bg-gray-100'
    }
  };

  // Detecta a categoria de movimento com base em palavras-chave
  const detectMovementCategory = (moveName: string): MovementType => {
    const lowerName = moveName.toLowerCase();
    
    if (/\b(despa|despacho|mero|expediente)\b/.test(lowerName)) return 'despacho';
    if (/\b(senten|julgado|procedente|improcedente)\b/.test(lowerName)) return 'sentenca';
    if (/\b(audi|sessao|ouvi|interrogatorio)\b/.test(lowerName)) return 'audiencia';
    if (/\b(deci|liminar|antecip|tutela|deferi|indeferi)\b/.test(lowerName)) return 'decisao';
    if (/\b(junt|anex|protoc|documento)\b/.test(lowerName)) return 'juntada';
    if (/\b(peti|requer|solicita)\b/.test(lowerName)) return 'peticao';
    
    return 'outros';
  };

  // Formata data e hora
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('pt-BR'),
        time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      return { date: 'Data inválida', time: '' };
    }
  };

  // Processar os dados da resposta da API
  const processMovements = useMemo(() => {
    if (!process.lastResponse) return [];

    const processData = process.lastResponse.data ? 
      process.lastResponse.data.hits?.hits?.[0]?._source : 
      process.lastResponse.hits?.hits?.[0]?._source;
    
    if (!processData?.movimentos) return [];

    return processData.movimentos.map((movimento: any) => {
      // Determina a categoria do movimento
      const category = detectMovementCategory(movimento.nome || '');
      
      // Formata a data
      const { date, time } = formatDateTime(movimento.dataHora);
      
      return {
        ...movimento,
        category,
        formattedDate: date,
        formattedTime: time,
        categoryInfo: moveCategories[category]
      };
    });
  }, [process.lastResponse]);

  // Filtra e ordena os movimentos
  const filteredMovements = useMemo(() => {
    let result = [...processMovements];
    
    // Filtro por termo de busca
    if (searchTerm) {
      result = result.filter(item => 
        item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.complementosTabelados?.some((comp: any) => 
          typeof comp === 'string' && comp.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Filtro por categoria
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    // Ordenação
    result.sort((a, b) => {
      const dateA = new Date(a.dataHora || 0).getTime();
      const dateB = new Date(b.dataHora || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    return result;
  }, [processMovements, searchTerm, selectedCategory, sortOrder]);

  // Verificar se há dados do processo disponíveis
  const hasProcessData = process.lastResponse && processMovements.length > 0;

  // Extrair dados básicos do processo
  const processData = process.lastResponse?.data ? 
    process.lastResponse.data.hits?.hits?.[0]?._source : 
    process.lastResponse?.hits?.hits?.[0]?._source;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-praxis-olive" />
            <span>Linha do Tempo do Processo</span>
          </div>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRefresh} 
              disabled={isLoading}
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
          )}
        </CardTitle>
        
        {hasProcessData && (
          <div className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar nas movimentações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.keys(moveCategories).map((key) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{moveCategories[key as MovementType].icon}</span>
                          <span className="capitalize">{key}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={sortOrder} 
                  onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Mais recentes primeiro</SelectItem>
                    <SelectItem value="asc">Mais antigos primeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredMovements.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <List className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Nenhum movimento encontrado com os filtros atuais.</p>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!hasProcessData && (
          <div className="text-center py-10">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-medium mb-2">Dados não disponíveis</h3>
            <p className="text-muted-foreground mb-4">
              Não há dados de movimentação disponíveis para este processo. 
              Tente atualizar os dados ou verificar se o processo está cadastrado corretamente.
            </p>
            {onRefresh && (
              <Button 
                onClick={onRefresh} 
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Atualizando...' : 'Buscar dados do processo'}
              </Button>
            )}
          </div>
        )}

        {hasProcessData && filteredMovements.length > 0 && (
          <div className="relative pl-6 border-l-2 border-praxis-olive space-y-6">
            {filteredMovements.map((movimento, index) => (
              <div key={index} className="relative">
                {/* Marcador de timeline personalizado por categoria */}
                <div className={`absolute -left-[1.7rem] w-5 h-5 rounded-full ${movimento.categoryInfo.backgroundColor} flex items-center justify-center`}>
                  <div className={movimento.categoryInfo.color}>
                    {movimento.categoryInfo.icon}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${movimento.categoryInfo.backgroundColor} ${movimento.categoryInfo.color} border-0`}
                      >
                        <div className="flex items-center gap-1">
                          {movimento.categoryInfo.icon}
                          <span className="capitalize">{movimento.category}</span>
                        </div>
                      </Badge>
                      <h4 className="font-medium">{movimento.formattedDate} - {movimento.formattedTime}</h4>
                    </div>
                    {movimento.orgaoJulgador?.nomeOrgao && (
                      <span className="text-sm text-muted-foreground mt-1 sm:mt-0">
                        {movimento.orgaoJulgador.nomeOrgao}
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-praxis-text">{movimento.nome}</p>
                    
                    {movimento.complementosTabelados?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium">Complementos:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground pl-2 space-y-1">
                          {movimento.complementosTabelados.map((complemento: any, cIndex: number) => (
                            <li key={cIndex}>
                              {typeof complemento === 'object' 
                                ? (complemento.nome || complemento.valor || JSON.stringify(complemento)) 
                                : complemento}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Informações adicionais - resumo */}
        {processData && (
          <div className="mt-6 pt-6 border-t border-dashed">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
              {processData.dataAjuizamento && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Data de Ajuizamento</span>
                  </div>
                  <div className="font-medium">{formatDateTime(processData.dataAjuizamento).date}</div>
                </div>
              )}
              
              {processData.classe?.nome && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Tag size={14} />
                    <span>Classe</span>
                  </div>
                  <div className="font-medium">{processData.classe.nome}</div>
                </div>
              )}
              
              {processData.orgaoJulgador?.nome && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-muted-foreground mb-1 flex items-center gap-1">
                    <FileText size={14} />
                    <span>Órgão Julgador</span>
                  </div>
                  <div className="font-medium">{processData.orgaoJulgador.nome}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
