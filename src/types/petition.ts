
export interface Petition {
  id: string;
  title: string;
  content: string;
  clientId?: string;
  caseId?: string;
  category: string;
  status?: 'draft' | 'completed' | 'in-progress';
  templateId?: string;
  type?: 'custom' | 'template';
  createdAt: string;
  updatedAt: string;
  isImported?: boolean;
  fileName?: string;
  fileSize?: number;
}

export interface GeneratePetitionParams {
  prompt: string;
  category: string;
  clientId?: string;
  detailLevel?: 'basic' | 'standard' | 'comprehensive';
}

export interface ImportPetitionParams {
  title: string;
  fileName: string;
  fileSize: number;
  content: string;
  category: string;
  clientId?: string;
}
