import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LexMLSearchParams {
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
  searchType?: 'general' | 'law_number' | 'specific_term' | 'date_range';
  tipoNorma?: string;
  esfera?: 'federal' | 'estadual' | 'municipal' | 'distrital';
}

interface LegislationDocument {
  urn: string;
  title: string;
  summary: string;
  authority: string;
  location: string;
  date: string;
  type: string;
  fullTextUrl: string;
  pdfUrl?: string;
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
  categoria?: 'lei' | 'jurisprudencia' | 'outros';
}

interface QueryAnalysis {
  type: 'law_number' | 'general_term' | 'specific_document' | 'mixed';
  lawNumber?: string;
  year?: string;
  terms: string[];
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const params: LexMLSearchParams = await req.json();
    console.log('LexML SRU Search Request:', JSON.stringify(params, null, 2));

    if (!params.query?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analisar consulta para otimizar busca
    const queryAnalysis = analyzeQuery(params.query);
    console.log('Query Analysis:', queryAnalysis);

    // Executar busca SRU
    const result = await executeSRUSearch(params, queryAnalysis);
    
    const executionTime = Date.now() - startTime;

    if (!result || result.results.length === 0) {
      console.log('No results found for query:', params.query);
      
      return new Response(
        JSON.stringify({
          error: 'Nenhum resultado encontrado para a consulta',
          suggestions: generateSearchSuggestions(params.query),
          executionTime
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Adicionar metadados ao resultado
    result.searchQuery = params.query;
    result.searchType = queryAnalysis.type;
    result.executionTime = executionTime;

    console.log(`SRU Search completed successfully in ${executionTime}ms with ${result.results.length} results`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical error in lexml-sru-search function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno na busca de legislação',
        details: error.message,
        executionTime: Date.now() - startTime
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeSRUSearch(params: LexMLSearchParams, analysis: QueryAnalysis) {
  const baseUrl = 'https://www.lexml.gov.br/busca/SRU';
  
  try {
    console.log(`Executing SRU search for: ${params.query}`);
    
    // Construir query CQL para SRU
    const cqlQuery = buildCQLQuery(params.query, analysis);
    console.log(`CQL Query: ${cqlQuery}`);
    
    const sruParams = new URLSearchParams({
      operation: 'searchRetrieve',
      version: '1.2',
      query: cqlQuery,
      startRecord: String(params.startRecord || 1),
      maximumRecords: String(params.maxRecords || 20),
      recordSchema: 'oai_dc'
    });

    const url = `${baseUrl}?${sruParams.toString()}`;
    console.log(`SRU URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'LexML-SRU-Client/1.0',
        'Accept': 'application/xml, text/xml'
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      throw new Error(`SRU HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log(`SRU Response received: ${xmlText.length} characters`);

    if (xmlText.length < 100) {
      throw new Error('SRU response too short, likely invalid');
    }

    const results = await parseSRUResponse(xmlText);
    
    return {
      results,
      totalCount: results.length,
      currentPage: Math.ceil((params.startRecord || 1) / (params.maxRecords || 20)),
      totalPages: Math.ceil(results.length / (params.maxRecords || 20))
    };

  } catch (error) {
    console.error('SRU Search failed:', error.message);
    throw error;
  }
}

function buildCQLQuery(query: string, analysis: QueryAnalysis): string {
  // Escapar aspas na query
  const escapedQuery = query.replace(/"/g, '\\"');
  
  switch (analysis.type) {
    case 'law_number':
      if (analysis.lawNumber && analysis.year) {
        return `(dc.title any "${analysis.lawNumber}" and dc.date any "${analysis.year}") or dc.description any "${escapedQuery}"`;
      } else if (analysis.lawNumber) {
        return `dc.title any "${analysis.lawNumber}" or dc.description any "${escapedQuery}"`;
      }
      return `dc.title any "${escapedQuery}" or dc.description any "${escapedQuery}"`;
      
    case 'specific_document':
      return `dc.title any "${escapedQuery}" or dc.subject any "${escapedQuery}" or dc.description any "${escapedQuery}"`;
      
    case 'general_term':
      const terms = analysis.terms.filter(t => t.length > 2);
      if (terms.length === 0) {
        return `dc.title any "${escapedQuery}" or dc.description any "${escapedQuery}"`;
      }
      const termQueries = terms.map(term => `(dc.title any "${term}" or dc.description any "${term}")`);
      return termQueries.join(' and ');
      
    default:
      return `dc.title any "${escapedQuery}" or dc.description any "${escapedQuery}" or dc.subject any "${escapedQuery}"`;
  }
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function parseSRUResponse(xmlText: string): Promise<LegislationDocument[]> {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error(`SRU XML parsing error: ${parseError.textContent}`);
    }

    // Buscar elementos de resultado na resposta SRU
    const resultElements = Array.from(xmlDoc.querySelectorAll('record'));
    
    if (resultElements.length === 0) {
      // Tentar outros seletores comuns em respostas SRU
      const alternativeSelectors = [
        'searchRetrieveResponse record',
        'records record',
        'srw\\:record', 'zs\\:record',
        '[*|record]'
      ];
      
      for (const selector of alternativeSelectors) {
        const elements = Array.from(xmlDoc.querySelectorAll(selector));
        if (elements.length > 0) {
          resultElements.push(...elements);
          break;
        }
      }
    }

    console.log(`Parsing ${resultElements.length} SRU result elements`);

    const results: LegislationDocument[] = [];

    for (let i = 0; i < resultElements.length; i++) {
      try {
        const element = resultElements[i];

        // Extrair campos principais da resposta SRU
        const tipo = getSRUElementText(element, ['tipo', 'type', 'tipoDocumento']);
        const titulo = getSRUElementText(element, ['titulo', 'title', 'nome']);
        const ementa = getSRUElementText(element, ['ementa', 'description', 'resumo', 'abstract']);
        const url = getSRUElementText(element, ['url', 'link', 'endereco']);
        const data = getSRUElementText(element, ['data', 'date', 'dataPublicacao']);
        const orgao = getSRUElementText(element, ['orgao', 'authority', 'emissor', 'origem']);
        const urn = getSRUElementText(element, ['urn', 'identificador', 'id']) || generateURN(titulo, data);

        // Determinar categoria baseada no tipo
        const categoria = determineCategory(tipo, titulo);

        // Extrair número e ano
        const numero = extractLawNumber(titulo);
        const ano = extractYear(data, titulo);

        const doc: LegislationDocument = {
          urn,
          title: cleanText(titulo) || `Documento ${i + 1}`,
          summary: cleanText(ementa) || 'Documento jurídico disponível no LexML',
          authority: extractAuthority(orgao, tipo),
          location: 'Brasil',
          date: formatDate(data),
          type: extractDocumentType(tipo, titulo),
          fullTextUrl: url || `https://www.lexml.gov.br/busca/search?q=${encodeURIComponent(titulo)}`,
          numero,
          ano,
          ementa: cleanText(ementa),
          publicacao: formatDate(data),
          orgaoJulgador: cleanText(orgao),
          categoria
        };

        results.push(doc);
      } catch (recordError) {
        console.warn(`Error processing SRU result ${i}:`, recordError.message);
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error('SRU response parsing failed:', error);
    throw new Error(`Erro ao processar resposta SRU: ${error.message}`);
  }
}

function getSRUElementText(parent: Element, selectors: string[]): string {
  for (const selector of selectors) {
    try {
      // Tentar seletor direto
      let element = parent.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }

      // Tentar com namespaces e Dublin Core
      const nsSelectors = [
        `dc\\:${selector}`, `oai_dc\\:${selector}`, `srw\\:${selector}`,
        `[*|${selector}]`, `${selector.toLowerCase()}`, `${selector.toUpperCase()}`
      ];

      for (const nsSelector of nsSelectors) {
        element = parent.querySelector(nsSelector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      }
    } catch (e) {
      continue;
    }
  }
  return '';
}

function determineCategory(tipo: string, titulo: string): 'lei' | 'jurisprudencia' | 'outros' {
  const tipoLower = (tipo || '').toLowerCase();
  const tituloLower = (titulo || '').toLowerCase();

  // Verificar se é jurisprudência
  if (tipoLower.includes('jurisprudencia') || tipoLower.includes('jurisprudência') ||
      tipoLower.includes('acordao') || tipoLower.includes('acórdão') ||
      tipoLower.includes('decisao') || tipoLower.includes('decisão') ||
      tituloLower.includes('stf') || tituloLower.includes('stj') ||
      tituloLower.includes('resp') || tituloLower.includes('rec') ||
      tituloLower.includes('tribunal')) {
    return 'jurisprudencia';
  }

  // Verificar se é lei
  if (tipoLower.includes('lei') || tipoLower.includes('decreto') ||
      tipoLower.includes('portaria') || tipoLower.includes('medida') ||
      tipoLower.includes('constituicao') || tipoLower.includes('constituição') ||
      tituloLower.includes('lei') || tituloLower.includes('decreto')) {
    return 'lei';
  }

  return 'outros';
}

function generateURN(titulo: string, data: string): string {
  const timestamp = Date.now();
  const hashSuffix = Math.random().toString(36).substring(2, 8);
  return `urn:lexml:br:sru:doc:${timestamp}-${hashSuffix}`;
}

function analyzeQuery(query: string): QueryAnalysis {
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

function cleanText(text: string): string {
  if (!text) return '';
  return text.trim()
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .substring(0, 500);
}

function extractLawNumber(title: string): string | undefined {
  if (!title) return undefined;
  
  const match = title.match(/(?:lei|decreto|portaria)\s*n[ºo°]?\s*(\d+(?:\.\d+)*)/i);
  return match ? match[1] : undefined;
}

function extractYear(date: string, title: string): string | undefined {
  if (date) {
    const match = date.match(/(\d{4})/);
    if (match) return match[1];
  }
  
  if (title) {
    const match = title.match(/(\d{4})/);
    if (match) return match[1];
  }
  
  return undefined;
}

function extractAuthority(orgao: string, tipo: string): string {
  const source = orgao || tipo || '';
  
  if (source) {
    const lower = source.toLowerCase();
    if (lower.includes('federal') || lower.includes('união') || lower.includes('brasil')) {
      return 'Federal';
    }
    if (lower.includes('estado') || lower.includes('estadual')) {
      return 'Estadual';
    }
    if (lower.includes('município') || lower.includes('municipal')) {
      return 'Municipal';
    }
    if (lower.includes('stf') || lower.includes('supremo')) {
      return 'STF';
    }
    if (lower.includes('stj') || lower.includes('superior')) {
      return 'STJ';
    }
  }
  
  return 'Federal';
}

function extractDocumentType(type: string, title: string): string {
  if (type?.trim()) {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  
  const titleLower = (title || '').toLowerCase();
  if (titleLower.includes('lei')) return 'Lei';
  if (titleLower.includes('decreto')) return 'Decreto';
  if (titleLower.includes('portaria')) return 'Portaria';
  if (titleLower.includes('constituição')) return 'Constituição';
  if (titleLower.includes('acórdão') || titleLower.includes('acordao')) return 'Acórdão';
  
  return 'Documento';
}

function formatDate(dateStr: string): string {
  if (!dateStr?.trim()) return '';
  
  try {
    let date: Date;
    
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      date = new Date(dateStr);
    } else if (dateStr.match(/^\d{4}$/)) {
      return dateStr;
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function generateSearchSuggestions(query: string): string[] {
  const suggestions = [];
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('lei')) {
    suggestions.push('Tente especificar o número da lei (ex: "Lei 8078")');
    suggestions.push('Adicione o ano da lei (ex: "Lei 8078/1990")');
  }
  
  if (/\d/.test(query)) {
    suggestions.push('Certifique-se de que o número está correto');
    suggestions.push('Tente buscar apenas pelo número (ex: "8078")');
  }
  
  suggestions.push('Use termos mais específicos');
  suggestions.push('Tente sinônimos ou termos relacionados');
  suggestions.push('Verifique a grafia dos termos utilizados');
  
  return suggestions.slice(0, 3);
}
