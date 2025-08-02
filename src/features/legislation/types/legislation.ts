export interface LegislationDocument {
  urn: string;
  title: string;
  summary: string;
  authority: string;
  location: string;
  date: string;
  type: string;
  fullTextUrl: string;
  pdfUrl?: string;
  // Campos adicionais do LexML
  numero?: string;
  ano?: string;
  ementa?: string;
  situacao?: string;
  orgaoJulgador?: string;
  publicacao?: string;
  vigencia?: string;
  revogacao?: string;
  alteracao?: string;
  regulamentacao?: string;
  // Nova categoria para separar leis e jurisprudência
  categoria?: 'lei' | 'jurisprudencia' | 'outros';
}

export interface LegislationSearchParams {
  query: string;
  type?: 'legislation' | 'jurisprudence' | 'doctrine' | 'all';
  authority?: 'federal' | 'state' | 'municipal' | 'district' | 'all';
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  startRecord?: number;
  maxRecords?: number;
  number?: string;
  year?: string;
  nickname?: string;
  acronym?: string;
  // Novos parâmetros para buscas específicas
  searchType?: 'general' | 'law_number' | 'specific_term' | 'date_range';
  tipoNorma?: string;
  esfera?: 'federal' | 'estadual' | 'municipal' | 'distrital';
}

export interface LegislationSearchResult {
  results: LegislationDocument[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchQuery?: string;
  searchType?: string;
  executionTime?: number;
  // Novos campos para categorização
  totalLeis?: number;
  totalJurisprudencia?: number;
  totalOutros?: number;
}

export interface LegislationFilter {
  type: 'legislation' | 'jurisprudence' | 'doctrine' | 'all';
  authority: 'federal' | 'state' | 'municipal' | 'district' | 'all';
  location: string;
  dateFrom: string;
  dateTo: string;
}

// Tipos para análise de consulta
export interface QueryAnalysis {
  type: 'law_number' | 'general_term' | 'specific_document' | 'mixed';
  lawNumber?: string;
  year?: string;
  terms: string[];
  confidence: number;
}
