
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LegislationResultCard } from './LegislationResultCard';
import { LegislationDocument } from '../types/legislation';
import { Badge } from '@/components/ui/badge';
import { FileText, Gavel, BookOpen, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LegislationTabsProps {
  documents: LegislationDocument[];
  isLoading?: boolean;
}

export const LegislationTabs = ({ documents, isLoading = false }: LegislationTabsProps) => {
  const [activeTab, setActiveTab] = useState('all');

  // Separar documentos por categoria
  const leis = documents.filter(doc => doc.categoria === 'lei');
  const jurisprudencias = documents.filter(doc => doc.categoria === 'jurisprudencia');
  const outros = documents.filter(doc => doc.categoria === 'outros');

  const tabs = [
    {
      id: 'all',
      label: 'Todos',
      icon: BookOpen,
      documents: documents,
      count: documents.length
    },
    {
      id: 'leis',
      label: 'Leis',
      icon: FileText,
      documents: leis,
      count: leis.length
    },
    {
      id: 'jurisprudencia',
      label: 'Jurisprudência',
      icon: Gavel,
      documents: jurisprudencias,
      count: jurisprudencias.length
    }
  ];

  // Mostrar aba "Outros" apenas se houver documentos
  if (outros.length > 0) {
    tabs.push({
      id: 'outros',
      label: 'Outros',
      icon: AlertCircle,
      documents: outros,
      count: outros.length
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum documento encontrado para os critérios de busca informados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
            >
              <IconComponent className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <Badge variant="secondary" className="ml-1">
                {tab.count}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id} className="space-y-4">
          {tab.documents.length === 0 ? (
            <Alert>
              <tab.icon className="h-4 w-4" />
              <AlertDescription>
                Nenhum documento encontrado na categoria "{tab.label}".
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {tab.label} ({tab.count} resultado{tab.count !== 1 ? 's' : ''})
                </h3>
              </div>
              
              <div className="space-y-4">
                {tab.documents.map((document, index) => (
                  <LegislationResultCard
                    key={`${document.urn}-${index}`}
                    result={{
                      titulo: document.title,
                      ementa: document.summary,
                      tipo: document.type,
                      numero: document.numero,
                      ano: document.ano,
                      orgao_emissor: document.authority,
                      data_publicacao: document.date,
                      link_lexml: document.fullTextUrl,
                      xml_bruto: ''
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};
