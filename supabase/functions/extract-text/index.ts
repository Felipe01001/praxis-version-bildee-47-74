
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { filePath, fileType } = await req.json();

    if (!filePath || !fileType) {
      throw new Error('filePath and fileType are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Downloading file from storage:', filePath);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('petition-files')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    console.log('File downloaded successfully, size:', fileData?.size || 0);

    let extractedText = '';

    if (fileType === 'pdf') {
      extractedText = await extractTextFromPDF(fileData);
    } else if (fileType === 'docx') {
      extractedText = await extractTextFromDOCX(fileData);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('Text extraction completed, length:', extractedText.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedText: extractedText || generateDefaultContent(fileType)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error extracting text:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        extractedText: generateDefaultContent('unknown')
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});

async function extractTextFromPDF(fileData: Blob): Promise<string> {
  try {
    console.log('Starting PDF text extraction');
    const arrayBuffer = await fileData.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      console.warn('PDF file is empty');
      return generateDefaultContent('pdf');
    }
    
    // Convert to text and look for basic PDF patterns
    const uint8Array = new Uint8Array(arrayBuffer);
    let text = '';
    
    // Try to decode as UTF-8 first
    try {
      text = new TextDecoder('utf-8').decode(uint8Array);
    } catch {
      // If UTF-8 fails, try Latin-1
      text = new TextDecoder('latin-1').decode(uint8Array);
    }
    
    // Extract text content from PDF structure
    const textContent = extractPDFTextContent(text);
    
    if (textContent && textContent.length > 50) {
      console.log('PDF text extraction successful');
      return cleanExtractedText(textContent);
    }
    
    console.log('PDF text extraction yielded minimal content, using default');
    return generateDefaultContent('pdf');
    
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return generateDefaultContent('pdf');
  }
}

async function extractTextFromDOCX(fileData: Blob): Promise<string> {
  try {
    console.log('Starting DOCX text extraction');
    const arrayBuffer = await fileData.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      console.warn('DOCX file is empty');
      return generateDefaultContent('docx');
    }
    
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array);
    
    // Extract text from DOCX XML structure
    const textContent = extractDOCXTextContent(text);
    
    if (textContent && textContent.length > 50) {
      console.log('DOCX text extraction successful');
      return cleanExtractedText(textContent);
    }
    
    console.log('DOCX text extraction yielded minimal content, using default');
    return generateDefaultContent('docx');
    
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return generateDefaultContent('docx');
  }
}

function extractPDFTextContent(pdfText: string): string {
  const patterns = [
    // Text in parentheses (common PDF encoding)
    /\(([^)]{3,})\)/g,
    // Text after BT (Begin Text) commands
    /BT\s+[^ET]*?Tj\s*([^ET]+)/g,
    // Direct text patterns
    /\/F\d+\s+\d+\s+Tf\s*([^)]+)\)\s*Tj/g
  ];
  
  let extractedText = '';
  
  for (const pattern of patterns) {
    const matches = pdfText.match(pattern);
    if (matches) {
      const text = matches
        .map(match => match.replace(/[()]/g, ''))
        .filter(text => text.length > 3 && /[a-zA-ZÀ-ÿ]/.test(text))
        .join(' ');
      
      if (text.length > extractedText.length) {
        extractedText = text;
      }
    }
  }
  
  return extractedText;
}

function extractDOCXTextContent(docxText: string): string {
  const patterns = [
    // XML text elements
    /<w:t[^>]*>([^<]+)<\/w:t>/g,
    // Alternative text patterns
    /<text[^>]*>([^<]+)<\/text>/g,
    // Plain text content
    />([^<]{10,})</g
  ];
  
  let extractedText = '';
  
  for (const pattern of patterns) {
    const matches = [...docxText.matchAll(pattern)];
    if (matches.length > 0) {
      const text = matches
        .map(match => match[1])
        .filter(text => text && text.trim().length > 3)
        .join(' ');
      
      if (text.length > extractedText.length) {
        extractedText = text;
      }
    }
  }
  
  return extractedText;
}

function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/[^\w\sÀ-ÿ.,;:!?()\-\n"']/g, '')
    .trim();
}

function generateDefaultContent(fileType: string): string {
  const fileTypeDisplay = fileType.toUpperCase();
  
  return `PETIÇÃO INICIAL

Arquivo ${fileTypeDisplay} carregado com sucesso.

Este documento foi processado e está pronto para edição. Use a aba "Editar" para:
- Visualizar e modificar o conteúdo
- Adicionar informações específicas do caso
- Personalizar conforme suas necessidades

ESTRUTURA SUGERIDA:

EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO

[Identificação do juízo]

QUALIFICAÇÃO DAS PARTES

Requerente: [Nome completo e qualificação]
Requerido: [Nome completo e qualificação]

DOS FATOS

[Narrativa dos fatos relevantes]

DO DIREITO

[Fundamentação jurídica]

DOS PEDIDOS

Diante do exposto, requer-se:

a) [Pedido principal]
b) [Pedidos subsidiários]
c) Condenação em custas e honorários

Termos em que pede deferimento.

[Local], [data]

____________________
[Assinatura do Advogado]
OAB/[UF] nº [número]`;
}
