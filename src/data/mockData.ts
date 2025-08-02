
import { Client, Category } from '@/types';

// Função auxiliar para gerar timestamps consistentes para os dados mockados
const generateTimestamp = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const mockClients: Client[] = [
  {
    id: "1",
    name: "João Silva",
    cpf: "123.456.789-00",
    phone: "(11) 98765-4321",
    email: "joao.silva@example.com",
    category: "social-security" as Category,
    birthDate: "1970-05-15",
    gender: "male",
    maritalStatus: "married",
    nationality: "Brasileiro",
    profession: "Metalúrgico",
    status: "active",
    rg: {
      number: "12.345.678-9",
      issuingBody: "SSP/SP"
    },
    address: {
      zipCode: "01234-567",
      street: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP"
    },
    respondent: {
      name: "INSS",
      address: "Av. Paulista, 1000, São Paulo - SP",
      cpf: ""
    },
    createdAt: generateTimestamp(365),
    updatedAt: generateTimestamp(30)
  },
  {
    id: "2",
    name: "Maria Oliveira",
    cpf: "987.654.321-00",
    phone: "(11) 91234-5678",
    email: "maria.oliveira@example.com",
    category: "criminal" as Category,
    birthDate: "1985-10-20",
    gender: "female",
    maritalStatus: "single",
    nationality: "Brasileira",
    profession: "Advogada",
    status: "active",
    rg: {
      number: "",
      issuingBody: ""
    },
    address: {
      zipCode: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: ""
    },
    createdAt: generateTimestamp(300),
    updatedAt: generateTimestamp(25)
  },
  {
    id: "3",
    name: "Pedro Sousa",
    cpf: "456.789.123-00",
    phone: "(11) 95555-4444",
    email: "pedro.sousa@example.com",
    category: "civil" as Category,
    birthDate: "1990-03-12",
    gender: "male",
    maritalStatus: "single",
    nationality: "Brasileiro",
    profession: "Engenheiro",
    status: "active",
    rg: {
      number: "",
      issuingBody: ""
    },
    address: {
      street: "Av. Paulista",
      number: "1500",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-200"
    },
    createdAt: generateTimestamp(250),
    updatedAt: generateTimestamp(20)
  },
  {
    id: "4",
    name: "Carla Mendes",
    cpf: "333.777.888-99",
    phone: "(11) 93333-2222",
    email: "carla.mendes@example.com",
    category: "social-security" as Category,
    birthDate: "1978-07-08",
    gender: "female",
    maritalStatus: "widowed",
    nationality: "Brasileira",
    profession: "Professora",
    status: "active",
    rg: {
      number: "",
      issuingBody: ""
    },
    address: {
      zipCode: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: ""
    },
    createdAt: generateTimestamp(200),
    updatedAt: generateTimestamp(15)
  },
  {
    id: "5",
    name: "Antônio Carlos",
    cpf: "222.444.555-66",
    phone: "(11) 98888-7777",
    email: "antonio.carlos@example.com",
    category: "criminal" as Category,
    birthDate: "1982-12-25",
    gender: "male",
    maritalStatus: "divorced",
    nationality: "Brasileiro",
    profession: "Médico",
    status: "active",
    rg: {
      number: "",
      issuingBody: ""
    },
    address: {
      zipCode: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: ""
    },
    createdAt: generateTimestamp(150),
    updatedAt: generateTimestamp(10)
  },
  {
    id: "6",
    name: "Ana Paula",
    cpf: "111.222.333-44",
    phone: "(11) 97777-6666",
    email: "ana.paula@example.com",
    category: "civil" as Category,
    birthDate: "1995-04-18",
    gender: "female",
    maritalStatus: "stable-union",
    nationality: "Brasileira",
    profession: "Arquiteta",
    status: "active",
    rg: {
      number: "",
      issuingBody: ""
    },
    address: {
      street: "Rua Augusta",
      number: "500",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      zipCode: "01304-000"
    },
    createdAt: generateTimestamp(100),
    updatedAt: generateTimestamp(5)
  }
];

export default mockClients;
