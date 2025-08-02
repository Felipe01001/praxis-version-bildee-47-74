
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export interface PetitionData {
  title: string;
  content: string;
  category: string;
  clientName?: string;
  createdAt: string;
}

// Clean text from markdown and HTML
const cleanText = (text: string): string => {
  return text
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/__([^_]+)__/g, '$1') // Remove underline markdown
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

// Convert markdown to styled text runs for DOCX
const parseMarkdownToRuns = (text: string): TextRun[] => {
  const runs: TextRun[] = [];
  let currentIndex = 0;
  
  // Process bold text
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > currentIndex) {
      const beforeText = text.slice(currentIndex, match.index);
      if (beforeText.trim()) {
        runs.push(new TextRun({ 
          text: beforeText,
          size: 24 // 12pt font
        }));
      }
    }
    
    // Add bold text
    runs.push(new TextRun({ 
      text: match[1], 
      bold: true,
      size: 24 // 12pt font
    }));
    
    currentIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText.trim()) {
      runs.push(new TextRun({ 
        text: remainingText,
        size: 24 // 12pt font
      }));
    }
  }
  
  return runs.length > 0 ? runs : [new TextRun({ 
    text: cleanText(text),
    size: 24 // 12pt font
  })];
};

export const downloadAsPDF = async (petitionData: PetitionData): Promise<void> => {
  try {
    // Create a temporary element with the petition content
    const tempElement = document.createElement('div');
    tempElement.className = 'legal-document-pdf';
    tempElement.style.width = '210mm'; // A4 width
    tempElement.style.padding = '25mm 20mm'; // Increase top/bottom padding
    tempElement.style.backgroundColor = 'white';
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    tempElement.style.fontFamily = 'Crimson Text, Times New Roman, serif';
    tempElement.style.fontSize = '14px'; // Increased from 12px
    tempElement.style.lineHeight = '1.6';
    tempElement.style.color = '#000';
    
    // Process content with proper legal document formatting
    const processedContent = petitionData.content
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
      .replace(/_{2}(.*?)_{2}/g, '<u style="text-decoration: underline;">$1</u>')
      .replace(/^#{3}\s(.+)$/gm, '<h3 style="font-size: 16px; font-weight: bold; text-align: center; margin: 20px 0 12px 0; text-transform: uppercase; letter-spacing: 0.3px;">$1</h3>')
      .replace(/^#{2}\s(.+)$/gm, '<h2 style="font-size: 18px; font-weight: bold; text-align: center; margin: 24px 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">$1</h2>')
      .replace(/^#{1}\s(.+)$/gm, '<h1 style="font-size: 20px; font-weight: bold; text-align: center; margin: 28px 0 20px 0; text-transform: uppercase; letter-spacing: 0.8px;">$1</h1>')
      .replace(/^\d+\.\s(.+)$/gm, '<p style="margin: 10px 0; margin-left: 2em; text-align: justify; text-indent: 0;">$1</p>')
      .replace(/^[a-z]\)\s(.+)$/gm, '<p style="margin: 8px 0; margin-left: 3em; text-align: justify; text-indent: 0;">$1</p>')
      .replace(/\n\n/g, '</p><p style="margin: 10px 0; text-align: justify; text-indent: 2em;">')
      .replace(/\n/g, '<br>');
    
    // Check if content starts with title formatting
    const hasFormattedTitle = processedContent.includes('<h1') || processedContent.includes('<h2');
    
    if (hasFormattedTitle) {
      tempElement.innerHTML = processedContent;
    } else {
      tempElement.innerHTML = `<p style="margin: 10px 0; text-align: justify; text-indent: 2em;">${processedContent}</p>`;
    }
    
    document.body.appendChild(tempElement);

    // Generate canvas from the element
    const canvas = await html2canvas(tempElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
    });

    // Remove temporary element
    document.body.removeChild(tempElement);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Save the PDF
    const fileName = `${petitionData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Erro ao gerar PDF. Tente novamente.');
  }
};

export const downloadAsDOCX = async (petitionData: PetitionData): Promise<void> => {
  try {
    const lines = petitionData.content.split('\n').filter(line => line.trim());
    const paragraphs: Paragraph[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Main headers (H1)
      if (trimmedLine.startsWith('# ') || 
          (trimmedLine.includes('EXCELENTÍSSIMO') || trimmedLine.includes('JUIZ'))) {
        const text = trimmedLine.replace(/^# /, '').replace(/\*\*/g, '');
        paragraphs.push(new Paragraph({
          children: [new TextRun({ 
            text: text, 
            bold: true,
            size: 32, // 16pt
            allCaps: true
          })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 240 }
        }));
      } 
      // Section headers (H2)
      else if (trimmedLine.startsWith('## ') || 
               (trimmedLine.includes('DOS ') || trimmedLine.includes('DA ') || trimmedLine.includes('DO '))) {
        const text = trimmedLine.replace(/^## /, '').replace(/\*\*/g, '');
        paragraphs.push(new Paragraph({
          children: [new TextRun({ 
            text: text, 
            bold: true,
            size: 28, // 14pt
            allCaps: true
          })],
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { before: 360, after: 180 }
        }));
      } 
      // Sub-section headers (H3)
      else if (trimmedLine.startsWith('### ')) {
        const text = trimmedLine.replace(/^### /, '').replace(/\*\*/g, '');
        paragraphs.push(new Paragraph({
          children: [new TextRun({ 
            text: text, 
            bold: true,
            size: 26, // 13pt
            allCaps: true
          })],
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 }
        }));
      } 
      // Numbered/lettered lists
      else if (/^\d+\./.test(trimmedLine) || /^[a-z]\)/.test(trimmedLine)) {
        paragraphs.push(new Paragraph({
          children: parseMarkdownToRuns(trimmedLine),
          spacing: { before: 120, after: 120 },
          indent: { left: 720 }, // 0.5 inch indent
          alignment: AlignmentType.JUSTIFIED
        }));
      } 
      // Regular paragraphs
      else {
        paragraphs.push(new Paragraph({
          children: parseMarkdownToRuns(trimmedLine),
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 120, after: 120 },
          indent: { firstLine: 720 } // First line indent
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      }],
      styles: {
        default: {
          document: {
            run: {
              font: 'Times New Roman',
              size: 24 // 12pt default
            },
            paragraph: {
              spacing: {
                line: 360, // 1.5 line spacing
              },
            },
          },
        },
      },
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `${petitionData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw new Error('Erro ao gerar DOCX. Tente novamente.');
  }
};

// Copy formatted text to clipboard
export const copyFormattedText = (content: string): void => {
  try {
    // Create a temporary element with formatted content
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    tempElement.style.fontFamily = 'Crimson Text, Times New Roman, serif';
    tempElement.style.fontSize = '14px';
    tempElement.style.lineHeight = '1.6';
    
    // Process content with formatting
    const processedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_{2}(.*?)_{2}/g, '<u>$1</u>')
      .replace(/^#{3}\s(.+)$/gm, '<div style="text-align: center; font-weight: bold; text-transform: uppercase; margin: 20px 0;">$1</div>')
      .replace(/^#{2}\s(.+)$/gm, '<div style="text-align: center; font-weight: bold; text-transform: uppercase; margin: 24px 0; font-size: 16px;">$1</div>')
      .replace(/^#{1}\s(.+)$/gm, '<div style="text-align: center; font-weight: bold; text-transform: uppercase; margin: 28px 0; font-size: 18px;">$1</div>')
      .replace(/^\d+\.\s(.+)$/gm, '<div style="margin: 10px 0; margin-left: 2em; text-align: justify;">$1</div>')
      .replace(/^[a-z]\)\s(.+)$/gm, '<div style="margin: 8px 0; margin-left: 3em; text-align: justify;">$1</div>')
      .replace(/\n\n/g, '</p><p style="margin: 10px 0; text-align: justify; text-indent: 2em;">')
      .replace(/\n/g, '<br>');
    
    tempElement.innerHTML = `<div style="text-align: justify; text-indent: 2em;">${processedContent}</div>`;
    document.body.appendChild(tempElement);
    
    // Create selection and copy
    const range = document.createRange();
    range.selectNode(tempElement);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    document.execCommand('copy');
    
    // Clean up
    selection?.removeAllRanges();
    document.body.removeChild(tempElement);
  } catch (error) {
    console.error('Error copying formatted text:', error);
    // Fallback to plain text copy
    navigator.clipboard.writeText(content);
  }
};

export const downloadAsJSON = (petitionData: PetitionData): void => {
  try {
    const jsonData = {
      ...petitionData,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json'
    });

    const fileName = `${petitionData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Error generating JSON:', error);
    throw new Error('Erro ao gerar JSON. Tente novamente.');
  }
};
