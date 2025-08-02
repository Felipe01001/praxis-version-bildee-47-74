
import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PetitionPreviewProps {
  content?: string;
  className?: string;
}

export const PetitionPreview = ({ content, className }: PetitionPreviewProps) => {
  const processContent = (text: string) => {
    if (!text || typeof text !== 'string') {
      return [
        <div key="empty" className="text-center py-8 text-muted-foreground">
          <p>Nenhum conteúdo disponível</p>
          <p className="text-sm">Use a aba "Editar" para adicionar conteúdo</p>
        </div>
      ];
    }
    
    // Limpar qualquer markdown residual
    let cleanedText = text
      .replace(/```markdown\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/#{1,6}\s*/g, '')
      .trim();
    
    const lines = cleanedText.split('\n');
    const processedLines: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        processedLines.push(<div key={index} className="h-2" />);
        return;
      }
      
      // Cabeçalho principal (EXCELENTÍSSIMO)
      if (trimmedLine.includes('EXCELENTÍSSIMO') || 
          trimmedLine.includes('JUIZ DE DIREITO') ||
          (trimmedLine === trimmedLine.toUpperCase() && 
           trimmedLine.length > 30 && 
           (trimmedLine.includes('VARA') || trimmedLine.includes('COMARCA')))) {
        processedLines.push(
          <h1 key={index} className="text-lg font-bold mb-6 mt-8 text-center uppercase tracking-wide text-gray-900 leading-tight">
            {trimmedLine.replace(/\*\*/g, '')}
          </h1>
        );
        return;
      }
      
      // Título da ação (segunda linha importante)
      if (index < 5 && trimmedLine.length > 10 && trimmedLine.length < 100 && 
          !trimmedLine.includes('EXCELENTÍSSIMO') && 
          !trimmedLine.includes('QUALIFICAÇÃO')) {
        processedLines.push(
          <h2 key={index} className="text-xl font-bold mb-6 text-center text-gray-900 leading-tight">
            {trimmedLine.replace(/\*\*/g, '')}
          </h2>
        );
        return;
      }
      
      // Seções principais (QUALIFICAÇÃO, DOS FATOS, DO DIREITO, DOS PEDIDOS)
      if (trimmedLine === trimmedLine.toUpperCase() && 
          (trimmedLine.includes('QUALIFICAÇÃO') || 
           trimmedLine.includes('DOS FATOS') || 
           trimmedLine.includes('DO DIREITO') || 
           trimmedLine.includes('DOS PEDIDOS') || 
           trimmedLine.includes('VALOR DA CAUSA') ||
           trimmedLine.startsWith('DOS ') || 
           trimmedLine.startsWith('DA ') || 
           trimmedLine.startsWith('DO '))) {
        processedLines.push(
          <h3 key={index} className="text-lg font-bold mb-4 mt-8 text-center uppercase tracking-wider text-gray-900 border-b-2 border-gray-300 pb-2">
            {trimmedLine.replace(/\*\*/g, '')}
          </h3>
        );
        return;
      }
      
      // Qualificação das partes (REQUERENTE, REQUERIDO)
      if (trimmedLine.includes('REQUERENTE:') || trimmedLine.includes('REQUERIDO:')) {
        const parts = trimmedLine.split(':');
        if (parts.length >= 2) {
          processedLines.push(
            <div key={index} className="mb-4 leading-relaxed">
              <span className="font-bold text-gray-900">{parts[0].replace(/\*\*/g, '')}:</span>
              <span className="ml-2">{parts.slice(1).join(':').replace(/\*\*/g, '')}</span>
            </div>
          );
          return;
        }
      }
      
      // Parágrafos numerados (1., 2., etc.)
      if (/^\d+\.\s/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+\.)\s(.+)/);
        if (match) {
          processedLines.push(
            <div key={index} className="flex gap-4 mb-4 items-start">
              <span className="font-bold min-w-[2rem] text-gray-900 flex-shrink-0">
                {match[1]}
              </span>
              <p className="flex-1 text-justify leading-relaxed text-gray-800">
                {match[2].replace(/\*\*/g, '')}
              </p>
            </div>
          );
          return;
        }
      }
      
      // Alíneas (a), b), etc.)
      if (/^[a-z]\)\s/.test(trimmedLine)) {
        const match = trimmedLine.match(/^([a-z]\))\s(.+)/);
        if (match) {
          processedLines.push(
            <div key={index} className="flex gap-4 mb-3 items-start ml-4">
              <span className="font-bold min-w-[2rem] text-gray-700 flex-shrink-0">
                {match[1]}
              </span>
              <p className="flex-1 text-justify leading-relaxed text-gray-800">
                {match[2].replace(/\*\*/g, '')}
              </p>
            </div>
          );
          return;
        }
      }
      
      // Fecho da petição
      if (trimmedLine.toLowerCase().includes('nestes termos') ||
          trimmedLine.toLowerCase().includes('pede deferimento')) {
        processedLines.push(
          <div key={index} className="text-center my-6 font-medium italic">
            <p>{trimmedLine.replace(/\*\*/g, '')}</p>
          </div>
        );
        return;
      }
      
      // Local e data
      if (/\w+,\s*\d+\s*de\s*\w+\s*de\s*\d{4}/.test(trimmedLine) ||
          /\w+\/\w+,/.test(trimmedLine)) {
        processedLines.push(
          <p key={index} className="text-right mb-6 font-medium">
            {trimmedLine.replace(/\*\*/g, '')}
          </p>
        );
        return;
      }
      
      // Assinatura do advogado
      if (trimmedLine.includes('OAB') || 
          /^\[.*\]$/.test(trimmedLine) ||
          (trimmedLine.length < 50 && index > lines.length - 5)) {
        processedLines.push(
          <div key={index} className="text-center mt-8">
            <div className="w-64 border-b border-gray-600 mx-auto mb-2"></div>
            <p className="text-sm font-medium text-gray-900">{trimmedLine.replace(/\*\*/g, '')}</p>
          </div>
        );
        return;
      }
      
      // HTML inline para centralização e alinhamento
      if (trimmedLine.includes('<div style=') && trimmedLine.includes('</div>')) {
        const htmlMatch = trimmedLine.match(/<div style="([^"]*)">(.*?)<\/div>/);
        if (htmlMatch) {
          const style = htmlMatch[1];
          const content = htmlMatch[2];
          let className = 'mb-4 leading-relaxed';
          
          if (style.includes('text-align: center')) {
            className += ' text-center';
          } else if (style.includes('text-align: right')) {
            className += ' text-right';
          }
          
          processedLines.push(
            <p key={index} className={className}>
              {content.replace(/\*\*/g, '')}
            </p>
          );
          return;
        }
      }
      
      // Parágrafos regulares
      const isLongParagraph = trimmedLine.length > 100;
      const shouldIndent = !trimmedLine.includes(':') && 
                          !trimmedLine.includes('Art.') && 
                          !trimmedLine.includes('§') &&
                          isLongParagraph &&
                          !trimmedLine.includes('OAB');
      
      processedLines.push(
        <p key={index} className={cn(
          "leading-relaxed mb-4 text-gray-800",
          shouldIndent ? "text-justify indent-8" : "text-justify"
        )}>
          {trimmedLine.replace(/\*\*/g, '')}
        </p>
      );
    });
    
    return processedLines;
  };

  return (
    <div className={cn(
      "legal-document bg-white p-8 rounded-md border min-h-[400px] shadow-sm max-w-4xl mx-auto print:shadow-none print:border-none", 
      className
    )}>
      <div className="prose prose-lg max-w-none font-serif text-gray-900 leading-relaxed">
        {processContent(content || '')}
      </div>
    </div>
  );
};
