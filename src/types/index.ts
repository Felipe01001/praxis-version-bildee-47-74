
// Import types from petition file
import { Petition, GeneratePetitionParams, ImportPetitionParams } from './petition';

export interface Client {
  id: string;
  name: string;
  cpf: string;
  category: Category;
  email: string;
  phone: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  birthDate: string;
  nationality: string;
  profession: string;
  rg: {
    number: string;
    issuingBody: string;
  };
  address: {
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  respondent?: {
    name: string;
    cpf: string;
    address: string;
  };
  status?: ClientStatus;
  govPassword?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface Case {
  id: string;
  clientId: string;
  category: Category;
  subCategory?: string;
  description: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  endDate?: string;
  caseNumber?: string;
}

export interface Task {
  id: string;
  clientId: string;
  caseId?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: Status;
  createdAt: string;
  attachments?: TaskAttachment[];
  updates?: TaskUpdate[];
  clientName?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'link';
  size?: number;
  uploadDate: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  description: string;
  date: string;
  userName?: string;
}

export interface Attachment {
  id: string;
  clientId: string;
  caseId?: string;
  title?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  url?: string;
  comment?: string;
  description?: string;
}

export interface JudicialProcess {
  id: string;
  clientId: string;
  caseId?: string;
  court: string;
  processNumber: string;
  phase: string;
  defendant: string;
  status: Status;
  updatedAt: string;
  numeroProcesso?: string;
  tribunal?: string;
  lastResponse?: any;
  dataCadastro?: string;
}

export interface CaseTimelineItem {
  id: string;
  caseId: string;
  date: string;
  title: string;
  description?: string;
  content?: string;
  type: TimelineItemType;
  status?: Status;
  imageUrl?: string;
  attachmentUrl?: string;
}

export type TimelineItemType = 'image' | 'attachment' | 'update' | 'note' | 'document' | 'hearing' | 'deadline';
export type Category = 'social-security' | 'criminal' | 'civil' | 'labor' | 'administrative';
export type SubCategory = 
  | 'retirement' | 'disability' | 'maternity' | 'sickness' | 'accident' | 'pension' | 'benefit-review' | 'other-social'
  | 'theft' | 'robbery' | 'drug-traffic' | 'homicide' | 'misdemeanor' | 'fraud' | 'domestic-violence' | 'other-criminal'
  | string;
export type Status = 'completed' | 'in-progress' | 'delayed' | 'analysis';
export type Gender = 'male' | 'female' | 'other' | 'non-binary';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'stable-union';
export type ClientStatus = 'active' | 'inactive' | 'pending';

// Re-export Petition types
export type { Petition, GeneratePetitionParams, ImportPetitionParams };
