
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Case, Attachment, Task, JudicialProcess, Petition } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface PraxisContextType {
  clients: Client[];
  cases: Case[];
  attachments: Attachment[];
  tasks: Task[];
  judicialProcesses: JudicialProcess[];
  petitions: Petition[];
  isLoading: boolean;
  addClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addCase: (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Case>;
  updateCase: (caseData: Case) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addAttachment: (attachment: Omit<Attachment, 'id' | 'uploadDate'>) => Promise<Attachment>;
  deleteAttachment: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addJudicialProcess: (process: Omit<JudicialProcess, 'id'>) => Promise<JudicialProcess>;
  updateJudicialProcess: (process: JudicialProcess) => Promise<void>;
  deleteJudicialProcess: (id: string) => Promise<void>;
  addPetition: (petition: Omit<Petition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Petition>;
  updatePetition: (petition: Petition) => Promise<void>;
  deletePetition: (id: string) => Promise<void>;
}

const PraxisContext = createContext<PraxisContextType | undefined>(undefined);

export const usePraxisContext = () => {
  const context = useContext(PraxisContext);
  if (!context) {
    throw new Error('usePraxisContext must be used within a PraxisProvider');
  }
  return context;
};

// Helper functions to transform data between database and app formats
const transformClientFromDB = (dbClient: any): Client => ({
  id: dbClient.id,
  name: dbClient.name,
  cpf: dbClient.cpf,
  category: dbClient.category,
  email: dbClient.email || '',
  phone: dbClient.phone || '',
  gender: dbClient.gender || 'male',
  maritalStatus: dbClient.maritalStatus || 'single',
  birthDate: dbClient.birthDate || '',
  nationality: dbClient.nationality || '',
  profession: dbClient.profession || '',
  rg: {
    number: dbClient.rgNumber || '',
    issuingBody: dbClient.rgIssuingBody || ''
  },
  address: {
    zipCode: dbClient.addressZipCode || '',
    street: dbClient.addressStreet || '',
    number: dbClient.addressNumber || '',
    neighborhood: dbClient.addressNeighborhood || '',
    city: dbClient.addressCity || '',
    state: dbClient.addressState || ''
  },
  respondent: dbClient.respondentName ? {
    name: dbClient.respondentName,
    cpf: dbClient.respondentCpf || '',
    address: dbClient.respondentAddress || ''
  } : undefined,
  status: dbClient.status || 'active',
  govPassword: dbClient.govPassword,
  updatedAt: dbClient.updatedAt,
  createdAt: dbClient.createdAt
});

const transformClientToDB = (client: Client) => {
  // Helper function to convert empty strings to null for date fields
  const formatDateField = (dateValue: string | undefined) => {
    if (!dateValue || dateValue.trim() === '') return null;
    return dateValue;
  };

  return {
    id: client.id,
    name: client.name,
    cpf: client.cpf || '',
    category: client.category,
    phone: client.phone || null,
    email: client.email || null,
    gender: client.gender || null,
    maritalStatus: client.maritalStatus || null,
    birthDate: formatDateField(client.birthDate),
    nationality: client.nationality || null,
    profession: client.profession || null,
    rgNumber: client.rg?.number || null,
    rgIssuingBody: client.rg?.issuingBody || null,
    addressZipCode: client.address?.zipCode || null,
    addressStreet: client.address?.street || null,
    addressNumber: client.address?.number || null,
    addressNeighborhood: client.address?.neighborhood || null,
    addressCity: client.address?.city || null,
    addressState: client.address?.state || null,
    respondentName: client.respondent?.name || null,
    respondentCpf: client.respondent?.cpf || null,
    respondentAddress: client.respondent?.address || null,
    status: client.status || 'active',
    govPassword: client.govPassword || null,
    updatedAt: client.updatedAt,
    createdAt: client.createdAt
  };
};

const transformCaseFromDB = (dbCase: any): Case => ({
  id: dbCase.id,
  clientId: dbCase.clientId,
  category: dbCase.category,
  subCategory: dbCase.subCategory,
  description: dbCase.description || '',
  status: dbCase.status,
  createdAt: dbCase.createdAt,
  updatedAt: dbCase.updatedAt,
  endDate: dbCase.endDate,
  caseNumber: dbCase.caseNumber
});

const transformCaseToDB = (caseData: Case) => {
  // Helper function to convert empty strings to null for date fields
  const formatDateField = (dateValue: string | undefined) => {
    if (!dateValue || dateValue.trim() === '') return null;
    return dateValue;
  };

  return {
    id: caseData.id,
    clientId: caseData.clientId,
    category: caseData.category,
    subCategory: caseData.subCategory || null,
    description: caseData.description || null,
    status: caseData.status,
    createdAt: caseData.createdAt,
    updatedAt: caseData.updatedAt,
    endDate: formatDateField(caseData.endDate),
    caseNumber: caseData.caseNumber || null
  };
};

const transformAttachmentFromDB = (dbAttachment: any): Attachment => ({
  id: dbAttachment.id,
  clientId: dbAttachment.clientId,
  caseId: dbAttachment.caseId,
  title: dbAttachment.title,
  fileName: dbAttachment.fileName,
  fileType: dbAttachment.fileType,
  fileSize: dbAttachment.fileSize || 0,
  uploadDate: dbAttachment.uploadDate,
  url: dbAttachment.url,
  comment: dbAttachment.comment,
  description: dbAttachment.description
});

const transformAttachmentToDB = (attachment: Attachment) => ({
  id: attachment.id,
  clientId: attachment.clientId,
  caseId: attachment.caseId,
  title: attachment.title,
  fileName: attachment.fileName,
  fileType: attachment.fileType,
  fileSize: attachment.fileSize,
  uploadDate: attachment.uploadDate,
  url: attachment.url,
  comment: attachment.comment,
  description: attachment.description
});

const transformTaskFromDB = (dbTask: any): Task => ({
  id: dbTask.id,
  clientId: dbTask.clientId,
  caseId: dbTask.caseId,
  title: dbTask.title,
  description: dbTask.description || '',
  startDate: dbTask.startDate || '',
  endDate: dbTask.endDate || '',
  status: dbTask.status,
  createdAt: dbTask.createdAt,
  clientName: dbTask.clientName
});

const transformTaskToDB = (task: Task) => ({
  id: task.id,
  clientId: task.clientId,
  caseId: task.caseId,
  title: task.title,
  description: task.description,
  startDate: task.startDate,
  endDate: task.endDate,
  status: task.status,
  createdAt: task.createdAt,
  // Remove clientName se for undefined para evitar erro
  ...(task.clientName && { clientName: task.clientName })
});

const transformJudicialProcessFromDB = (dbProcess: any): JudicialProcess => ({
  id: dbProcess.id,
  clientId: dbProcess.clientId,
  caseId: dbProcess.caseId,
  court: dbProcess.court || '',
  processNumber: dbProcess.processNumber || '',
  phase: dbProcess.phase || '',
  defendant: dbProcess.defendant || '',
  status: dbProcess.status || 'in-progress',
  updatedAt: dbProcess.updatedAt,
  numeroProcesso: dbProcess.processNumber,
  tribunal: dbProcess.tribunal,
  lastResponse: dbProcess.lastResponse ? (typeof dbProcess.lastResponse === 'string' ? JSON.parse(dbProcess.lastResponse) : dbProcess.lastResponse) : null,
  dataCadastro: dbProcess.dataCadastro
});

const transformJudicialProcessToDB = (process: JudicialProcess) => ({
  id: process.id,
  clientId: process.clientId,
  caseId: process.caseId,
  court: process.court,
  processNumber: process.processNumber || process.numeroProcesso,
  phase: process.phase,
  defendant: process.defendant,
  status: process.status,
  updatedAt: process.updatedAt,
  tribunal: process.tribunal,
  lastResponse: typeof process.lastResponse === 'string' ? process.lastResponse : JSON.stringify(process.lastResponse),
  dataCadastro: process.dataCadastro
});

const transformPetitionFromDB = (dbPetition: any): Petition => ({
  id: dbPetition.id,
  clientId: dbPetition.clientId,
  caseId: dbPetition.caseId,
  title: dbPetition.title,
  content: dbPetition.content,
  category: 'civil', // Default category since it's not in DB
  status: dbPetition.status || 'draft',
  templateId: dbPetition.templateId,
  type: dbPetition.type || 'custom',
  createdAt: dbPetition.createdAt,
  updatedAt: dbPetition.updatedAt
});

const transformPetitionToDB = (petition: Petition) => ({
  id: petition.id,
  clientId: petition.clientId,
  caseId: petition.caseId,
  title: petition.title,
  content: petition.content,
  status: petition.status,
  templateId: petition.templateId,
  type: petition.type,
  createdAt: petition.createdAt,
  updatedAt: petition.updatedAt
});

export const PraxisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [judicialProcesses, setJudicialProcesses] = useState<JudicialProcess[]>([]);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados quando usuário está autenticado
  useEffect(() => {
    if (!user) {
      // Limpar dados quando usuário não está autenticado
      setClients([]);
      setCases([]);
      setAttachments([]);
      setTasks([]);
      setJudicialProcesses([]);
      setPetitions([]);
      setIsLoading(false);
      return;
    }

    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      console.log('Carregando dados do usuário:', user.id);
      console.log('Tentando carregar dados...');
      
      // Carregar dados do Supabase usando filtros customizados
      const clientsRes = await supabase.from('clients').select('*').eq('userId', user.id).order('createdAt', { ascending: false });
      const casesRes = await supabase.from('cases').select('*').eq('userId', user.id).order('createdAt', { ascending: false });
      const attachmentsRes = await supabase.from('attachments').select('*').eq('userId', user.id).order('uploadDate', { ascending: false });
      const tasksRes = await supabase.from('tasks').select('*').eq('userId', user.id).order('createdAt', { ascending: false });
      const judicialProcessesRes = await supabase.from('judicial_processes').select('*').eq('userId', user.id).order('updatedAt', { ascending: false });
      const petitionsRes = await supabase.from('petitions').select('*').eq('userId', user.id).order('createdAt', { ascending: false });

      console.log('Respostas das consultas:');
      console.log('Clients:', clientsRes.error ? `ERRO: ${clientsRes.error.message}` : `${clientsRes.data?.length || 0} registros`);
      console.log('Cases:', casesRes.error ? `ERRO: ${casesRes.error.message}` : `${casesRes.data?.length || 0} registros`);
      console.log('Tasks:', tasksRes.error ? `ERRO: ${tasksRes.error.message}` : `${tasksRes.data?.length || 0} registros`);

      if (clientsRes.error) {
        console.error('Erro ao carregar clientes:', clientsRes.error);
        throw clientsRes.error;
      }
      if (casesRes.error) {
        console.error('Erro ao carregar casos:', casesRes.error);
        throw casesRes.error;
      }
      if (attachmentsRes.error) {
        console.error('Erro ao carregar anexos:', attachmentsRes.error);
        throw attachmentsRes.error;
      }
      if (tasksRes.error) {
        console.error('Erro ao carregar tarefas:', tasksRes.error);
        throw tasksRes.error;
      }
      if (judicialProcessesRes.error) {
        console.error('Erro ao carregar processos judiciais:', judicialProcessesRes.error);
        throw judicialProcessesRes.error;
      }
      if (petitionsRes.error) {
        console.error('Erro ao carregar petições:', petitionsRes.error);
        throw petitionsRes.error;
      }

      // Transform data from database format to app format
      console.log('Transformando dados do banco...');
      console.log('Clientes retornados do banco:', clientsRes.data?.length || 0);
      console.log('Casos retornados do banco:', casesRes.data?.length || 0);
      console.log('Tarefas retornadas do banco:', tasksRes.data?.length || 0);
      
      setClients((clientsRes.data || []).map(transformClientFromDB));
      setCases((casesRes.data || []).map(transformCaseFromDB));
      setAttachments((attachmentsRes.data || []).map(transformAttachmentFromDB));
      setTasks((tasksRes.data || []).map(transformTaskFromDB));
      setJudicialProcesses((judicialProcessesRes.data || []).map(transformJudicialProcessFromDB));
      setPetitions((petitionsRes.data || []).map(transformPetitionFromDB));

      console.log('Dados carregados com sucesso!');
      toast.success('Dados sincronizados com sucesso!');

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para manipular clientes
  const addClient = async (clientData: Omit<Client, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const newClient = {
      ...clientData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Dados do cliente antes da transformação:', newClient);
    
    const transformedData = transformClientToDB(newClient);
    console.log('Dados transformados para o banco:', transformedData);
    
    const dataToInsert = {
      ...transformedData,
      userId: user.id
    };
    
    console.log('Dados finais para inserção:', dataToInsert);

    const { data, error } = await supabase
      .from('clients')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar cliente no Supabase:', error);
      console.error('Detalhes do erro:', error.message, error.details, error.hint);
      toast.error(`Erro ao salvar cliente: ${error.message}`);
      throw error;
    }

    console.log('Dados retornados do Supabase:', data);
    
    const transformedClient = transformClientFromDB(data);
    setClients(prev => [transformedClient, ...prev]);
    toast.success('Cliente salvo com sucesso!');
    console.log('Cliente adicionado com sucesso:', transformedClient);
    return transformedClient;
  };

  const updateClient = async (client: Client) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updatedClient = {
      ...client,
      updatedAt: new Date().toISOString()
    };

    console.log('Atualizando cliente:', updatedClient);

    const { error } = await supabase
      .from('clients')
      .update(transformClientToDB(updatedClient))
      .eq('id', client.id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
      throw error;
    }

    setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));
    toast.success('Cliente atualizado com sucesso!');
    console.log('Cliente atualizado com sucesso:', updatedClient);
  };

  const deleteClient = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    console.log('Deletando cliente:', id);

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
      throw error;
    }

    setClients(prev => prev.filter(client => client.id !== id));
    setCases(prev => prev.filter(c => c.clientId !== id));
    setAttachments(prev => prev.filter(a => a.clientId !== id));
    setTasks(prev => prev.filter(t => t.clientId !== id));
    setJudicialProcesses(prev => prev.filter(p => p.clientId !== id));
    
    toast.success('Cliente excluído com sucesso!');
    console.log('Cliente deletado com sucesso:', id);
  };

  // Funções para manipular processos
  const addCase = async (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const now = new Date().toISOString();
    const newCase = {
      ...caseData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    console.log('Dados do caso antes da transformação:', newCase);
    
    const transformedData = transformCaseToDB(newCase);
    console.log('Dados transformados para o banco:', transformedData);
    
    const dataToInsert = {
      ...transformedData,
      userId: user.id
    };
    
    console.log('Dados finais para inserção:', dataToInsert);

    const { data, error } = await supabase
      .from('cases')
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar caso no Supabase:', error);
      console.error('Detalhes do erro:', error.message, error.details, error.hint);
      toast.error(`Erro ao salvar caso: ${error.message}`);
      throw error;
    }

    console.log('Dados retornados do Supabase:', data);
    
    const transformedCase = transformCaseFromDB(data);
    setCases(prev => [transformedCase, ...prev]);
    toast.success('Caso salvo com sucesso!');
    return transformedCase;
  };

  const updateCase = async (caseData: Case) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updatedCase = {
      ...caseData,
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('cases')
      .update(transformCaseToDB(updatedCase))
      .eq('id', caseData.id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao atualizar caso:', error);
      toast.error('Erro ao atualizar caso');
      throw error;
    }

    setCases(prev => prev.map(c => c.id === caseData.id ? updatedCase : c));
    toast.success('Caso atualizado com sucesso!');
  };

  const deleteCase = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao excluir caso:', error);
      toast.error('Erro ao excluir caso');
      throw error;
    }

    setCases(prev => prev.filter(c => c.id !== id));
    toast.success('Caso excluído com sucesso!');
  };

  // Funções para manipular anexos
  const addAttachment = async (attachmentData: Omit<Attachment, 'id' | 'uploadDate'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const newAttachment = {
      ...attachmentData,
      id: uuidv4(),
      uploadDate: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        ...transformAttachmentToDB(newAttachment),
        userId: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar anexo:', error);
      toast.error('Erro ao salvar anexo');
      throw error;
    }

    const transformedAttachment = transformAttachmentFromDB(data);
    setAttachments(prev => [transformedAttachment, ...prev]);
    toast.success('Anexo salvo com sucesso!');
    return transformedAttachment;
  };

  const deleteAttachment = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao excluir anexo:', error);
      toast.error('Erro ao excluir anexo');
      throw error;
    }

    setAttachments(prev => prev.filter(a => a.id !== id));
    toast.success('Anexo excluído com sucesso!');
  };

  // Funções para manipular tarefas
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const newTask = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    const taskForDB = transformTaskToDB(newTask);
    console.log('Dados da tarefa para o banco:', taskForDB);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskForDB,
        "userId": user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar tarefa:', error);
      toast.error('Erro ao salvar tarefa');
      throw error;
    }

    const transformedTask = transformTaskFromDB(data);
    setTasks(prev => [transformedTask, ...prev]);
    toast.success('Tarefa salva com sucesso!');
    return transformedTask;
  };

  const updateTask = async (id: string, task: Task) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('tasks')
      .update(transformTaskToDB(task))
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
      throw error;
    }

    setTasks(prev => prev.map(t => t.id === id ? task : t));
    toast.success('Tarefa atualizada com sucesso!');
  };

  const deleteTask = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
      throw error;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Tarefa excluída com sucesso!');
  };

  // Funções para manipular processos judiciais
  const addJudicialProcess = async (processData: Omit<JudicialProcess, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const newProcess = {
      ...processData,
      id: uuidv4(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('judicial_processes')
      .insert({
        ...transformJudicialProcessToDB(newProcess),
        userId: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar processo judicial:', error);
      toast.error('Erro ao salvar processo judicial');
      throw error;
    }

    const transformedProcess = transformJudicialProcessFromDB(data);
    setJudicialProcesses(prev => [transformedProcess, ...prev]);
    toast.success('Processo judicial salvo com sucesso!');
    return transformedProcess;
  };

  const updateJudicialProcess = async (process: JudicialProcess) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('judicial_processes')
      .update(transformJudicialProcessToDB(process))
      .eq('id', process.id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao atualizar processo judicial:', error);
      toast.error('Erro ao atualizar processo judicial');
      throw error;
    }

    setJudicialProcesses(prev => prev.map(p => p.id === process.id ? process : p));
    toast.success('Processo judicial atualizado com sucesso!');
  };

  const deleteJudicialProcess = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('judicial_processes')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao excluir processo judicial:', error);
      toast.error('Erro ao excluir processo judicial');
      throw error;
    }

    setJudicialProcesses(prev => prev.filter(p => p.id !== id));
    toast.success('Processo judicial excluído com sucesso!');
  };

  // Funções para manipular petições
  const addPetition = async (petitionData: Omit<Petition, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const now = new Date().toISOString();
    const newPetition = {
      ...petitionData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('petitions')
      .insert({
        ...transformPetitionToDB(newPetition),
        userId: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar petição:', error);
      toast.error('Erro ao salvar petição');
      throw error;
    }

    const transformedPetition = transformPetitionFromDB(data);
    setPetitions(prev => [transformedPetition, ...prev]);
    toast.success('Petição salva com sucesso!');
    return transformedPetition;
  };

  const updatePetition = async (petition: Petition) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updatedPetition = {
      ...petition,
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('petitions')
      .update(transformPetitionToDB(updatedPetition))
      .eq('id', petition.id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao atualizar petição:', error);
      toast.error('Erro ao atualizar petição');
      throw error;
    }

    setPetitions(prev => prev.map(p => p.id === petition.id ? updatedPetition : p));
    toast.success('Petição atualizada com sucesso!');
  };

  const deletePetition = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('petitions')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);

    if (error) {
      console.error('Erro ao excluir petição:', error);
      toast.error('Erro ao excluir petição');
      throw error;
    }

    setPetitions(prev => prev.filter(p => p.id !== id));
    toast.success('Petição excluída com sucesso!');
  };

  const contextValue = {
    clients,
    cases,
    attachments,
    tasks,
    judicialProcesses,
    petitions,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    addCase,
    updateCase,
    deleteCase,
    addAttachment,
    deleteAttachment,
    addTask,
    updateTask,
    deleteTask,
    addJudicialProcess,
    updateJudicialProcess,
    deleteJudicialProcess,
    addPetition,
    updatePetition,
    deletePetition
  };

  return (
    <PraxisContext.Provider value={contextValue}>
      {children}
    </PraxisContext.Provider>
  );
};
