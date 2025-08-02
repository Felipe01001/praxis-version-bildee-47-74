
import React, { useCallback, useMemo, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  ListOrdered, 
  List,
  Undo,
  Redo,
  TextQuote,
  Settings,
  Type
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const RichTextEditor = ({ value, onChange, className }: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = useCallback((type: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let beforeText = textarea.value.substring(0, start);
    let afterText = textarea.value.substring(end);
    let newText = '';
    let newCursorPos = start;

    switch (type) {
      case 'bold':
        if (selectedText) {
          newText = `**${selectedText}**`;
          newCursorPos = start + newText.length;
        } else {
          newText = '****';
          newCursorPos = start + 2;
        }
        break;
      
      case 'italic':
        if (selectedText) {
          newText = `*${selectedText}*`;
          newCursorPos = start + newText.length;
        } else {
          newText = '**';
          newCursorPos = start + 1;
        }
        break;
      
      case 'underline':
        if (selectedText) {
          newText = `__${selectedText}__`;
          newCursorPos = start + newText.length;
        } else {
          newText = '____';
          newCursorPos = start + 2;
        }
        break;
      
      case 'center':
        const lines = selectedText ? selectedText.split('\n') : [''];
        newText = lines.map(line => `<div style="text-align: center">${line}</div>`).join('\n');
        newCursorPos = start + newText.length;
        break;
      
      case 'right':
        const rightLines = selectedText ? selectedText.split('\n') : [''];
        newText = rightLines.map(line => `<div style="text-align: right">${line}</div>`).join('\n');
        newCursorPos = start + newText.length;
        break;
      
      case 'h1':
        newText = selectedText ? `# ${selectedText}` : '# ';
        newCursorPos = selectedText ? start + newText.length : start + 2;
        break;
      
      case 'h2':
        newText = selectedText ? `## ${selectedText}` : '## ';
        newCursorPos = selectedText ? start + newText.length : start + 3;
        break;
      
      case 'h3':
        newText = selectedText ? `### ${selectedText}` : '### ';
        newCursorPos = selectedText ? start + newText.length : start + 4;
        break;
      
      case 'ol':
        if (selectedText) {
          const olLines = selectedText.split('\n');
          newText = olLines.map((line, i) => `${i + 1}. ${line}`).join('\n');
        } else {
          newText = '1. ';
          newCursorPos = start + 3;
        }
        break;
      
      case 'ul':
        if (selectedText) {
          const ulLines = selectedText.split('\n');
          newText = ulLines.map(line => `- ${line}`).join('\n');
        } else {
          newText = '- ';
          newCursorPos = start + 2;
        }
        break;
      
      case 'quote':
        if (selectedText) {
          newText = selectedText.split('\n').map(line => `> ${line}`).join('\n');
        } else {
          newText = '> ';
          newCursorPos = start + 2;
        }
        break;
      
      default:
        return;
    }

    const fullNewValue = beforeText + newText + afterText;
    onChange(fullNewValue);
    
    // Update cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [onChange]);

  const insertTemplate = useCallback((templateType: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionEnd;
    let template = '';
    
    switch (templateType) {
      case 'facts':
        template = '\n\nDOS FATOS\n\n1. Em [data], ocorreu [descrição do fato];\n\n2. Em seguida, [continuação dos fatos];\n\n3. [Continuar a narrativa];\n\n';
        break;
      case 'law':
        template = '\n\nDO DIREITO\n\nA presente demanda encontra amparo legal nos seguintes dispositivos:\n\n1. Conforme o Art. [número] da [legislação], [citar texto legal];\n\n2. Segundo o Art. [número] do [código], [citar texto legal];\n\n3. A jurisprudência do [tribunal] tem se firmado no sentido de que [citar entendimento];\n\n';
        break;
      case 'requests':
        template = '\n\nDOS PEDIDOS\n\nAnte o exposto, requer a Vossa Excelência:\n\na) A citação do réu para, querendo, contestar a presente ação;\n\nb) A procedência do pedido para [descrever pedido principal];\n\nc) A condenação do réu em custas e honorários advocatícios;\n\nd) A produção de provas por todos os meios admitidos em direito;\n\n';
        break;
      case 'closure':
        template = '\n\nNestes termos,\nPede deferimento.\n\n[Cidade], [data].\n\n[Nome do Advogado]\nOAB/[Estado] [número]\n';
        break;
      default:
        return;
    }
    
    const beforeText = textarea.value.substring(0, cursorPos);
    const afterText = textarea.value.substring(cursorPos);
    const newValue = beforeText + template + afterText;
    
    onChange(newValue);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPos + template.length, cursorPos + template.length);
      }
    }, 0);
  }, [onChange]);

  const handleFontChange = useCallback((font: string) => {
    if (textareaRef.current) {
      textareaRef.current.style.fontFamily = font;
    }
  }, []);

  const handleFontSizeChange = useCallback((size: string) => {
    if (textareaRef.current) {
      textareaRef.current.style.fontSize = size;
    }
  }, []);

  const lineCount = useMemo(() => {
    return value.split('\n').length;
  }, [value]);

  const wordCount = useMemo(() => {
    return value.trim() ? value.trim().split(/\s+/).length : 0;
  }, [value]);

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {/* Toolbar */}
      <div className="bg-muted/40 p-3 rounded-md border">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Font and Size */}
          <Select onValueChange={handleFontChange} defaultValue="serif">
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="serif">Times (Serif)</SelectItem>
              <SelectItem value="sans-serif">Arial (Sans)</SelectItem>
              <SelectItem value="monospace">Monospace</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={handleFontSizeChange} defaultValue="16px">
            <SelectTrigger className="h-9 w-[80px]">
              <SelectValue placeholder="Tamanho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="14px">14px</SelectItem>
              <SelectItem value="16px">16px</SelectItem>
              <SelectItem value="18px">18px</SelectItem>
              <SelectItem value="20px">20px</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-8" />

          {/* Text Formatting */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('bold')}
              className="h-9 w-9 p-0"
              title="Negrito"
            >
              <Bold className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('italic')}
              className="h-9 w-9 p-0"
              title="Itálico"
            >
              <Italic className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('underline')}
              className="h-9 w-9 p-0"
              title="Sublinhado"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Headers */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('h1')}
              className="h-9 px-2"
              title="Título 1"
            >
              H1
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('h2')}
              className="h-9 px-2"
              title="Título 2"
            >
              H2
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('h3')}
              className="h-9 px-2"
              title="Título 3"
            >
              H3
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Alignment */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('left')}
              className="h-9 w-9 p-0"
              title="Alinhar à esquerda"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('center')}
              className="h-9 w-9 p-0"
              title="Centralizar"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('right')}
              className="h-9 w-9 p-0"
              title="Alinhar à direita"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Lists and Quote */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('ol')}
              className="h-9 w-9 p-0"
              title="Lista numerada"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('ul')}
              className="h-9 w-9 p-0"
              title="Lista com marcadores"
            >
              <List className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyFormatting('quote')}
              className="h-9 w-9 p-0"
              title="Citação"
            >
              <TextQuote className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Template Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => insertTemplate('facts')}
          className="text-xs"
        >
          Inserir Fatos
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => insertTemplate('law')}
          className="text-xs"
        >
          Inserir Fundamento Legal
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => insertTemplate('requests')}
          className="text-xs"
        >
          Inserir Pedidos
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => insertTemplate('closure')}
          className="text-xs"
        >
          Inserir Fechamento
        </Button>
      </div>

      {/* Editor Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[500px] w-full p-4 font-serif text-base border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          placeholder="Digite o conteúdo da petição aqui..."
          style={{ fontFamily: 'serif', fontSize: '16px' }}
        />
        
        {/* Stats */}
        <div className="absolute bottom-3 right-3 flex gap-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
          <span>{lineCount} linhas</span>
          <span>{wordCount} palavras</span>
          <span>{value.length} caracteres</span>
        </div>
      </div>
    </div>
  );
};
