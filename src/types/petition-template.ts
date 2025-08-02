
export interface PetitionTemplate {
  id: string;
  tema: string;
  subtema: string;
  titulo: string;
  ordem: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface PetitionTemplateFile {
  id: string;
  template_id: string;
  arquivo_nome: string;
  arquivo_url: string;
  tipo: 'docx' | 'pdf';
  file_size?: number;
  content_text?: string;
  upload_date: string;
}

export interface PetitionTemplateWithFiles extends PetitionTemplate {
  files: PetitionTemplateFile[];
}
