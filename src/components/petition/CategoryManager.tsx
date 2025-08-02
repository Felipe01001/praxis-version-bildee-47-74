import React, { useState } from 'react';
import { Plus, FolderOpen, FileText, ChevronDown, ChevronRight, Upload, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface CategoryItem {
  id: string;
  title: string;
  order: string;
  files: Array<{
    id: string;
    name: string;
    type: 'pdf' | 'docx';
    url: string;
    content?: string;
  }>;
}

interface Category {
  id: string;
  title: string;
  order: string;
  items: CategoryItem[];
  isOpen: boolean;
}

interface CategoryManagerProps {
  onAddTemplate: (categoryTitle: string, itemTitle: string, order: string) => void;
  onFileUpload: (templateId: string, file: File) => void;
}

export const CategoryManager = ({ onAddTemplate, onFileUpload }: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      title: 'PETIÇÃO GERAL',
      order: '1',
      isOpen: true,
      items: [
        { id: '1.1', title: 'Petição inicial – GERAL – Contra PESSOA FÍSICA', order: '1.1', files: [] },
        { id: '1.2', title: 'PETIÇÃO INICIAL - GERAL - contra PESSOA JURÍDICA', order: '1.2', files: [] },
        { id: '1.3', title: 'PETIÇÃO INICIAL - GERAL - contra Órgão GDF - Juizado da Fazenda do DF', order: '1.3', files: [] },
        { id: '1.4', title: 'Estrutura básica de PETIÇÃO INICIAL', order: '1.4', files: [] },
      ]
    },
    {
      id: '2',
      title: 'ACIDENTE DE TRÂNSITO',
      order: '2',
      isOpen: false,
      items: [
        { id: '2.1', title: 'ACIDENTE de TRÂNSITO - UM autor x UM requerido - reparação de danos', order: '2.1', files: [] },
        { id: '2.2', title: 'ACIDENTE de TRÂNSITO - UM autor x DOIS requeridos - reparação de danos', order: '2.2', files: [] },
        { id: '2.3', title: 'ACIDENTE de TRÂNSITO - DOIS autores x UM requerido - reparação de danos', order: '2.3', files: [] },
        { id: '2.4', title: 'ACIDENTE de TRÂNSITO - DOIS autores x DOIS requeridos - reparação de danos', order: '2.4', files: [] },
        { id: '2.5', title: 'Acidente de Trânsito - ORIENTAÇÕES', order: '2.5', files: [] },
      ]
    },
    {
      id: '3',
      title: 'BANCO-CARTÃO DE CRÉDITO',
      order: '3',
      isOpen: false,
      items: [
        { id: '3.01', title: 'BANCO – desconto indevido em conta – GERAL - REPETIÇÃO INDÉBITO', order: '3.01', files: [] },
        { id: '3.02', title: 'BANCO – CHEQUE CLONADO e COMPENSADO – Ressarcimento', order: '3.02', files: [] },
        { id: '3.03', title: 'BANCO – CHEQUE CLONADO e DEVOLVIDO SEM FUNDOS – Obrigação de fazer', order: '3.03', files: [] },
        { id: '3.04', title: 'BANCO – Abertura de CONTA SALÁRIO – Taxa de Manutenção INDEVIDA – REPETIÇÃO INDÉBITO', order: '3.04', files: [] },
        { id: '3.05', title: 'BANCO – Transações bancárias clandestinas – NULIDADE de negócio jurídico', order: '3.05', files: [] },
        { id: '3.05.1', title: 'BANCO – transações bancárias clandestinas – nulidade - devolução em dobro e dano moral.', order: '3.05.1', files: [] },
        { id: '3.06', title: 'CARTÃO CRÉDITO – Compras clandestinas – NULIDADE de negócio jurídico', order: '3.06', files: [] },
        { id: '3.08', title: 'BANCO - dívidas reconhecidas – retenção de salário - limitar ao teto de 30% - danos morais - tutela de urgência', order: '3.08', files: [] },
        { id: '3.09', title: 'BANCO - Demora na fila - indenização moral', order: '3.09', files: [] },
        { id: '3.10', title: 'BANCO – Empréstimo Consignado – FALSO EMPRÉSTIMO - fraude - nulidade - Tutela de URGÊNCIA', order: '3.10', files: [] },
        { id: '3.11', title: 'BANCO – Empréstimo Consignado – OFERTA RECUSADA - fraude - nulidade - Tutela de URGÊNCIA', order: '3.11', files: [] },
        { id: '3.12', title: 'BANCO – Empréstimo Consignado – GOLPE FALSA PORTABILIDADE – fraude - nulidade – Tutela de URGÊNCIA', order: '3.12', files: [] },
        { id: '3.13', title: 'BANCO – GOLPE DO BOLETO FALSO – Pagamento para TERCEIRO – dever de indenizar', order: '3.13', files: [] },
        { id: '3.14', title: 'BANCO – transações clandestinas – GOLPE DO MOTOBOY - nulidade – dever de indenizar', order: '3.14', files: [] },
        { id: '3.15', title: 'CARTÃO CRÉDITO – Envio SEM solicitação – NULIDADE de Contrato - COM negativação - tutela de URGÊNCIA', order: '3.15', files: [] },
        { id: '3.16', title: 'CARTÃO CRÉDITO – Envio SEM solicitação – NULIDADE de Contrato - SEM negativação', order: '3.16', files: [] },
      ]
    },
    {
      id: '4',
      title: 'COBRANÇA DE DÍVIDA',
      order: '4',
      isOpen: false,
      items: [
        { id: '4.1.0', title: 'COBRANÇA - Venda de mercadoria - falta de pagamento', order: '4.1.0', files: [] },
        { id: '4.1.1', title: 'COBRANÇA - Venda de mercadoria - cheque prescrito - falta de pagamento', order: '4.1.1', files: [] },
        { id: '4.2.0', title: 'COBRANÇA - Prestação de serviço - falta de pagamento', order: '4.2.0', files: [] },
        { id: '4.2.1', title: 'COBRANÇA - Prestação de serviço – Réu PJ – falta de pagamento', order: '4.2.1', files: [] },
        { id: '4.3', title: 'COBRANÇA - Empréstimo de dinheiro - falta de pagamento', order: '4.3', files: [] },
        { id: '4.4.0', title: 'COBRANÇA - Aluguel - somente LOCATÁRIO', order: '4.4.0', files: [] },
        { id: '4.4.1', title: 'COBRANÇA - Aluguel - somente FIADOR', order: '4.4.1', files: [] },
        { id: '4.4.2', title: 'COBRANÇA - Aluguel - contra LOCATÁRIO e FIADOR', order: '4.4.2', files: [] },
        { id: '4.5', title: 'ORIENTAÇÕES - cobrança de dívidas', order: '4.5', files: [] },
      ]
    },
    {
      id: '5',
      title: 'COMPRA DE PRODUTO – CONSUMIDOR',
      order: '5',
      isOpen: false,
      items: [
        { id: '5.1.0', title: 'COMPRA E VENDA – produto NÃO entregue – rescisão contratual e devolução de quantia paga', order: '5.1.0', files: [] },
        { id: '5.1.1', title: 'COMPRA E VENDA – produto NÃO entregue – obrigação de entregar', order: '5.1.1', files: [] },
        { id: '5.2.0', title: 'COMPRA E VENDA – produto DEFEITUOSO – rescisão contratual e devolução de quantia paga', order: '5.2.0', files: [] },
        { id: '5.2.1', title: 'COMPRA E VENDA – produto DEFEITUOSO – Substituição do produto', order: '5.2.1', files: [] },
        { id: '5.2.2', title: 'COMPRA E VENDA – Produto DEFEITUOSO – FALTA DE PEÇAS - Indenização material', order: '5.2.2', files: [] },
        { id: '5.3', title: 'COMPRA E VENDA – Acidente de consumo – Indenização material', order: '5.3', files: [] },
        { id: '5.4', title: 'COMPRA E VENDA – Compra pela internet – Rescisão com devolução de quantia paga', order: '5.4', files: [] },
        { id: '5.5', title: 'COMPRA E VENDA - Compra pela Internet – SITE FALSO – Indenização material', order: '5.5', files: [] },
        { id: '5.6', title: 'ORIENTAÇÕES PARA O CONSUMIDOR', order: '5.6', files: [] },
      ]
    },
    {
      id: '6',
      title: 'CONDOMÍNIO-DIREITO DE VIZINHANÇA',
      order: '6',
      isOpen: false,
      items: [
        { id: '6.1', title: 'VIZINHANÇA – Perturbação do sossego – BARULHO', order: '6.1', files: [] },
        { id: '6.2', title: 'VIZINHANÇA – direito de CONSTRUIR – permissão de acesso ao imóvel do vizinho', order: '6.2', files: [] },
        { id: '6.3', title: 'VIZINHANÇA – Dever de cautela ANIMAL – ATAQUE CANINO – Indenização material', order: '6.3', files: [] },
        { id: '6.4.0', title: 'VIZINHANÇA – Construção de OBRA NOVA – dano em imóvel – indenização material', order: '6.4.0', files: [] },
        { id: '6.4.1', title: 'VIZINHANÇA – Construção de OBRA NOVA – dano em imóvel – dever de reparar os danos', order: '6.4.1', files: [] },
        { id: '6.5.0', title: 'VIZINHANÇA – Infiltração de água – dano em imóvel – indenização material', order: '6.5.0', files: [] },
        { id: '6.5.1', title: 'VIZINHANÇA – Infiltração de água – dano em imóvel – obrigação de reparar os danos', order: '6.5.1', files: [] },
        { id: '6.6', title: 'CONDOMÍNIO – FURTO DE BICICLETA – Indenização material', order: '6.6', files: [] },
        { id: '6.7.0', title: 'CONDOMÍNIO – MULTA INDEVIDA e NÃO PAGA - Cancelamento da multa', order: '6.7.0', files: [] },
        { id: '6.7.1', title: 'CONDOMÍNIO – MULTA INDEVIDA e PAGA - Declaratória e Restituição', order: '6.7.1', files: [] },
      ]
    },
    {
      id: '7',
      title: 'DESPEJO PARA USO PRÓPRIO',
      order: '7',
      isOpen: false,
      items: [
        { id: '7.1', title: 'DESPEJO para uso próprio', order: '7.1', files: [] },
      ]
    },
    {
      id: '8',
      title: 'ESTABELECIMENTO DE ENSINO',
      order: '8',
      isOpen: false,
      items: [
        { id: '8.3', title: 'ENSINO – Contrato rescindido pelo AUTOR – Aulas NÃO iniciadas – devolução de quantia', order: '8.3', files: [] },
        { id: '8.4', title: 'ENSINO – Contrato rescindido pelo RÉU – devolução de quantia', order: '8.4', files: [] },
      ]
    },
    {
      id: '9',
      title: 'EXECUÇÃO DE TÍTULO EXTRAJUDICIAL',
      order: '9',
      isOpen: false,
      items: [
        { id: '9.1', title: 'Execução Extrajudicial - CHEQUE - inadimplemento', order: '9.1', files: [] },
        { id: '9.2', title: 'Execução Extrajudicial - NOTA PROMISSÓRIA - inadimplemento', order: '9.2', files: [] },
        { id: '9.3.0', title: 'Execução Extrajudicial - DUPLICATA - com aceite - inadimplemento', order: '9.3.0', files: [] },
        { id: '9.3.1', title: 'Execução Extrajudicial - DUPLICATA - sem aceite - protesto - inadimplemento', order: '9.3.1', files: [] },
        { id: '9.4.0', title: 'Execução Extrajudicial - CONTRATO DE LOCAÇÃO - LOCATÁRIO', order: '9.4.0', files: [] },
        { id: '9.4.1', title: 'Execução Extrajudicial - CONTRATO DE LOCAÇÃO - FIADOR SOLIDÁRIO', order: '9.4.1', files: [] },
        { id: '9.4.2', title: 'Execução Extrajudicial - CONTRATO DE LOCAÇÃO - LOCATÁRIO e FIADOR', order: '9.4.2', files: [] },
        { id: '9.5.0', title: 'Execução Extrajudicial - CONTRATO com 2 TESTEMUNHAS - obrigação de fazer', order: '9.5.0', files: [] },
        { id: '9.5.1', title: 'Execução Extrajudicial - CONTRATO com 2 TESTEMUNHAS - pagar quantia certa e obrigação de fazer', order: '9.5.1', files: [] },
        { id: '9.5.2', title: 'Execução Extrajudicial - CONTRATO com 2 TESTEMUNHAS - pagar quantia certa', order: '9.5.2', files: [] },
        { id: '9.6', title: 'ExecuçãoExtrajudicial_ORIENTAÇÕES', order: '9.6', files: [] },
      ]
    },
    {
      id: '10',
      title: 'EXECUÇÃO DE TÍTULO JUDICIAL',
      order: '10',
      isOpen: false,
      items: [
        { id: '10.1', title: 'EXECUÇÃO - título judicial - sentença homologatória - pagar quantia certa', order: '10.1', files: [] },
        { id: '10.2', title: 'EXECUÇÃO - título judicial - sentença homologatória - obrigação de fazer', order: '10.2', files: [] },
        { id: '10.3', title: 'EXECUÇÃO - título judicial - sentença homologatória - pagar quantia certa e obrigação de fazer', order: '10.3', files: [] },
      ]
    },
    {
      id: '11',
      title: 'LOCAÇÃO DE IMÓVEL',
      order: '11',
      isOpen: false,
      items: [
        { id: '11.1.0', title: 'COBRANÇA - Aluguel - somente LOCATÁRIO', order: '11.1.0', files: [] },
        { id: '11.1.1', title: 'COBRANÇA - Aluguel - somente FIADOR', order: '11.1.1', files: [] },
        { id: '11.1.2', title: 'COBRANÇA - Aluguel - contra LOCATÁRIO e FIADOR', order: '11.1.2', files: [] },
        { id: '11.1.3', title: 'COBRANÇA - Locação de imóvel – Ação regressiva – Fiador - avalista contra inquilino - ressarcimento', order: '11.1.3', files: [] },
        { id: '11.2.0', title: 'Execução Extrajudicial - CONTRATO DE LOCAÇÃO - LOCATÁRIO', order: '11.2.0', files: [] },
        { id: '11.2.1', title: 'Execução Extrajudicial - CONTRATO DE LOCAÇÃO - FIADOR SOLIDÁRIO', order: '11.2.1', files: [] },
        { id: '11.2.2', title: 'Execução Extrajudicial - CONTRATO DE LOCAÇÃO - LOCATÁRIO e FIADOR', order: '11.2.2', files: [] },
        { id: '11.3', title: 'Locação de imóvel – administração de imóvel – quebra de contrato – rescisão e indenização', order: '11.3', files: [] },
        { id: '11.4', title: 'Locação de imóvel – Locatário x Imobiliária – rescisão antecipada pela imobiliária – indenização material', order: '11.4', files: [] },
        { id: '11.4.1', title: 'Locação de imóvel – Locatário x locador (PF) – rescisão antecipada pelo locador – indenização material', order: '11.4.1', files: [] },
        { id: '11.5', title: 'Locação de imóvel – Locatário x Imobiliária – rescisão antecipada pela imobiliária – indenização material e moral', order: '11.5', files: [] },
        { id: '11.5.1', title: 'Locação de imóvel – Locatário x locador (PF) – rescisão antecipada pelo locador – indenização material e moral', order: '11.5.1', files: [] },
        { id: '11.6', title: 'Locação de imóvel – Locatário x Imobiliária – caução não devolvida – restituição', order: '11.6', files: [] },
        { id: '11.6.1', title: 'Locação de imóvel – Locatário x locador (PF) – caução não devolvida – restituição', order: '11.6.1', files: [] },
        { id: '11.7', title: 'Locação de imóvel – Locatário x Imobiliária – aluguel antecipado – desocupação do imóvel – restituição', order: '11.7', files: [] },
        { id: '11.7.1', title: 'Locação de imóvel – Locatário x locador (PF) – aluguel antecipado – desocupação do imóvel – restituição', order: '11.7.1', files: [] },
        { id: '11.8', title: 'Locação de imóvel – Locatário x Imobiliária – rescisão – vistoria pendente – rescisão e entrega das chaves', order: '11.8', files: [] },
        { id: '11.8.1', title: 'Locação de imóvel – Locatário x locador (PF) – rescisão - vistoria pendente – rescisão e entrega das chaves', order: '11.8.1', files: [] },
        { id: '11.9', title: 'Locação de imóvel – Locatário x Imobiliária – cobrança vexatória -abusiva – indenização moral', order: '11.9', files: [] },
        { id: '11.9.1', title: 'Locação de imóvel – Locatário x locador (PF) – cobrança vexatória -abusiva – indenização moral', order: '11.9.1', files: [] },
        { id: '11.10', title: 'Locação de imóvel – Locatário x Imobiliária – imóvel sem condições habitáveis – rescisão e indenização', order: '11.10', files: [] },
        { id: '11.10.1', title: 'Locação de imóvel – Locatário x locador (PF) – imóvel sem condições habitáveis – rescisão e indenização', order: '11.10.1', files: [] },
        { id: '11.11', title: 'Locação de imóvel – Locatário x Imobiliária – imóvel sem condições habitáveis – sanar os defeitos', order: '11.11', files: [] },
        { id: '11.11.1', title: 'Locação de imóvel – Locatário x Locador (PF) – imóvel sem condições habitáveis – sanar os defeitos', order: '11.11.1', files: [] },
      ]
    },
    {
      id: '12',
      title: 'NEGATIVAÇÃO INDEVIDA',
      order: '12',
      isOpen: false,
      items: [
        { id: '12.1', title: 'NEGATIVAÇÃO INDEVIDA - dívida paga - baixa da restrição - indenização - antecipação de tutela', order: '12.1', files: [] },
        { id: '12.2', title: 'NEGATIVAÇÃO INDEVIDA – FALTA DE NOTIFICAÇÃO PRÉVIA – baixa da restrição - indenização', order: '12.2', files: [] },
        { id: '12.3', title: 'NEGATIVAÇÃO INDEVIDA - fraude contratual - baixa da restrição - indenização', order: '12.3', files: [] },
        { id: '12.4', title: 'Negativação indevida – RECONHECIMENTO JUDICIAL ANTERIOR – baixa da restrição - indenização', order: '12.4', files: [] },
        { id: '12.5', title: 'NEGATIVAÇÃO INDEVIDA – CHEQUE ANTECIPADO – baixa da restrição - indenização - tutela de urgência', order: '12.5', files: [] },
        { id: '12.6', title: 'NEGATIVAÇÃO INDEVIDA - dívida NÃO reconhecida - baixa da restrição - indenização - antecipação de tutela', order: '12.6', files: [] },
      ]
    },
    {
      id: '13',
      title: 'OPERADORA DE TURISMO',
      order: '13',
      isOpen: false,
      items: [
        { id: '13.1', title: 'TURISMO – Seguro Viagem – NÃO cobertura de gastos - Ressarcimento', order: '13.1', files: [] },
        { id: '13.2.0', title: 'TURISMO – Rescisão pelo AUTOR – multa rescisória abusiva – rescisão de contrato vigente', order: '13.2.0', files: [] },
        { id: '13.2.1', title: 'TURISMO – Rescisão pelo AUTOR – multa rescisória abusiva – revisão do cancelamento', order: '13.2.1', files: [] },
        { id: '13.3.0', title: 'TURISMO – FALHA DO SERVIÇO – multa rescisória abusiva – rescisão de contrato', order: '13.3.0', files: [] },
        { id: '13.3.1', title: 'TURISMO – FALHA DO SERVIÇO – multa rescisória abusiva – revisão do valor reembolsado', order: '13.3.1', files: [] },
      ]
    },
    {
      id: '14',
      title: 'PLANOS DE SAÚDE',
      order: '14',
      isOpen: false,
      items: [
        { id: '14.1', title: 'PLANO DE SAÚDE – PORTABILIDADE na MESMA OPERADORA – NÃO EFETIVAÇÃO – Restituição', order: '14.1', files: [] },
        { id: '14.2', title: 'PLANO DE SAÚDE – PORTABILIDADE outra OPERADORA – NÃO EFETIVAÇÃO – Restituição', order: '14.2', files: [] },
        { id: '14.3', title: 'PLANO DE SAÚDE – Cancelamento indevido – NEGATIVA DE ATENDIMENTO - reembolso', order: '14.3', files: [] },
        { id: '14.4', title: 'PLANO DE SAÚDE – contrato vigente e adimplido - NEGATIVA DE COBERTURA - reembolso', order: '14.4', files: [] },
      ]
    },
    {
      id: '15',
      title: 'PRESTAÇÃO DE SERVIÇOS – CONSUMIDOR',
      order: '15',
      isOpen: false,
      items: [
        { id: '15.1', title: 'PRESTAÇÃO DE SERVIÇO – RÉU PJ - Serviço NÃO executado – Cumprir o Contrato', order: '15.1', files: [] },
        { id: '15.2', title: 'PRESTAÇÃO DE SERVIÇO – RÉU PF - Serviço NÃO executado – Cumprir o Contrato', order: '15.2', files: [] },
        { id: '15.3', title: 'PRESTAÇÃO DE SERVIÇO – RÉU PJ - Serviço NÃO executado – Rescisão com Restituição', order: '15.3', files: [] },
        { id: '15.4', title: 'PRESTAÇÃO DE SERVIÇO – RÉU PF - Serviço NÃO executado – Rescisão com restituição', order: '15.4', files: [] },
        { id: '15.5', title: 'Prestação de serviço – motorista por aplicativo – descredenciamento arbitrário – reativar conta e indenizar', order: '15.5', files: [] },
        { id: '15.6', title: 'Prestação de serviço – RÉU PJ – GOLPE DA FALSA AGENCIA DE VEÍCULO', order: '15.6', files: [] },
      ]
    },
    {
      id: '16',
      title: 'TELEFONIA-TV-INTERNET',
      order: '16',
      isOpen: false,
      items: [
        { id: '16.1', title: 'TELEFONIA- cobranças indevidas GERAL – descumprimento contratual - GERAL', order: '16.1', files: [] },
        { id: '16.2', title: 'TELEFONIA – cobranças indevidas GERAL – FATURAS PAGAS – devolução em dobro', order: '16.2', files: [] },
        { id: '16.3', title: 'TELEFONIA – cobranças indevidas GERAL – FATURAS NÃO PAGAS – revisão dos valores', order: '16.3', files: [] },
        { id: '16.4', title: 'TELEFONIA – Pedido de RESCISÃO não efetivado – FATURAS PAGAS – devolução em dobro', order: '16.4', files: [] },
        { id: '16.5', title: 'TELEFONIA – Pedido de RESCISÃO não efetivado – FATURAS NÃO PAGAS – revisão dos valores', order: '16.5', files: [] },
        { id: '16.6', title: 'TELEFONIA – inclusão de SERVIÇO NÃO SOLICITADO – revisar os valores', order: '16.6', files: [] },
        { id: '16.7', title: 'TELEFONIA – CANCELAMENTO-BLOQUEIO DE SERVIÇO indevido – obrigação de fazer', order: '16.7', files: [] },
        { id: '16.8', title: 'TELEFONIA – MUDANÇA DE PLANO – propaganda enganosa – obrigação de fazer', order: '16.8', files: [] },
      ]
    },
    {
      id: '17',
      title: 'TRANSPORTE AÉREO',
      order: '17',
      isOpen: false,
      items: [
        { id: '17.1', title: 'TRANSPORTE AÉREO - Atraso de voo – indenização material', order: '17.1', files: [] },
        { id: '17.2', title: 'TRANSPORTE AÉREO - Cancelamento de bilhete unilateral - CORONAVÍRUS - Abusividade de multa – Reembolso', order: '17.2', files: [] },
        { id: '17.3', title: 'TRANSPORTE AÉREO - Cancelamento de voo pela operadora – indenização material', order: '17.3', files: [] },
        { id: '17.4', title: 'TRANSPORTE AÉREO - Dano em mala - indenização material', order: '17.4', files: [] },
        { id: '17.5', title: 'TRANSPORTE AÉREO - Desistência de voo pelo consumidor – tempo razoável - abusividade de multa – reembolso', order: '17.5', files: [] },
        { id: '17.6', title: 'TRANSPORTE AÉREO - Extravio de bagagem - indenização material', order: '17.6', files: [] },
        { id: '17.7', title: 'TRANSPORTE AÉREO - Perda de Check-In – No show - abusividade de multa rescisória – devolução integral', order: '17.7', files: [] },
        { id: '17.8', title: 'TRANSPORTE AÉREO – preterição no embarque - OVERBOOKING – indenização material', order: '17.8', files: [] },
        { id: '17.9', title: 'TRANSPORTE AÉREO - Violação e extravio de objetos na bagagem - indenização material', order: '17.9', files: [] },
      ]
    },
    {
      id: '18',
      title: 'TRANSPORTE RODOVIÁRIO',
      order: '18',
      isOpen: false,
      items: [
        { id: '18.1', title: 'TRANSPORTE RODOVIÁRIO - pane ônibus - demora na troca – indenização material', order: '18.1', files: [] },
        { id: '18.2', title: 'TRANSPORTE RODOVIÁRIO - Atraso no embarque – indenização material', order: '18.2', files: [] },
        { id: '18.3', title: 'TRANSPORTE RODOVIÁRIO - Dano em mala - indenização material', order: '18.3', files: [] },
        { id: '18.4', title: 'TRANSPORTE RODOVIÁRIO - Extravio de bagagem - indenização material', order: '18.4', files: [] },
        { id: '18.5', title: 'TRANSPORTE RODOVIÁRIO – preterição no embarque - OVERBOOKING – indenização material', order: '18.5', files: [] },
        { id: '18.6', title: 'TRANSPORTE RODOVIÁRIO - Violação e extravio de objetos na bagagem - indenização material', order: '18.6', files: [] },
      ]
    },
    {
      id: '19',
      title: 'VEÍCULOS, exceto COLISÃO',
      order: '19',
      isOpen: false,
      items: [
        { id: '19.1', title: 'VEÍCULO – DANO INTENCIONAL – Crime de dano – Indenização material', order: '19.1', files: [] },
        { id: '19.2', title: 'VEÍCULO – FURTO de objetos em ESTACIONAMENTO - arrombamento – Indenização material', order: '19.2', files: [] },
        { id: '19.4.1', title: 'VEÍCULO – Réu PJ - Compra e venda – VÍCIO OCULTO – Ressarcimento', order: '19.4.1', files: [] },
        { id: '19.5', title: 'VEÍCULO – Réu PJ - Compra com troca – débitos e TRANSFERÊNCIA', order: '19.5', files: [] },
        { id: '19.6', title: 'VEÍCULO – Réu PF - Compra e Venda PARTICULAR – débitos e TRANSFERÊNCIA', order: '19.6', files: [] },
        { id: '19.6.1', title: 'VEÍCULO – Réu PF - Compra e Venda PARTICULAR – SEM débitos e TRANSFERÊNCIA', order: '19.6.1', files: [] },
        { id: '19.7', title: 'VEÍCULO – Réu PF - Venda com ÁGIO – Débitos vencidos – Em parte PAGOS pelo autor', order: '19.7', files: [] },
        { id: '19.8', title: 'VEÍCULO – Réu PF - Venda com ÁGIO – Débitos vencidos e NÃO PAGOS pelo autor', order: '19.8', files: [] },
        { id: '19.9.0', title: 'VEÍCULO – Réu PF - Compra e venda – DEFEITO GRAVE – Rescisão', order: '19.9.0', files: [] },
        { id: '19.9.1', title: 'VEÍCULO – Réu PJ - Compra e venda – DEFEITO GRAVE – Rescisão', order: '19.9.1', files: [] },
        { id: '19.10', title: 'VEÍCULO – Réu PF - Compra e Venda – DÉBITOS ANTERIORES – dever do vendedor', order: '19.10', files: [] },
        { id: '19.11.0', title: 'VEÍCULO – Réu PF - Compra e Venda – DOCUMENTAÇÃO PENDENTE – dever do vendedor', order: '19.11.0', files: [] },
        { id: '19.11.1', title: 'VEÍCULO – Réu PJ - Compra e Venda – DOCUMENTAÇÃO PENDENTE – dever do vendedor', order: '19.11.1', files: [] },
        { id: '19.12', title: 'VEÍCULO – Contrato de SEGURO – sinistro – NÃO cobertura do conserto – dever de reparar', order: '19.12', files: [] },
        { id: '19.13', title: 'VEÍCULO – Contrato de SEGURO – sinistro – NÃO cobertura do conserto - ressarcimento', order: '19.13', files: [] },
        { id: '19.14', title: 'VEÍCULO – Réu PF - Compra e venda – FALTA DE PAGAMENTO – devolução do veículo', order: '19.14', files: [] },
      ]
    },
    {
      id: '20',
      title: 'JUIZADOS ESPECIAIS DA FAZENDA DO DF',
      order: '20',
      isOpen: false,
      items: [
        { id: '20.1', title: 'FAZENDA – Réu GDF - servidor ATIVO – Exercícios financeiros não pagos', order: '20.1', files: [] },
        { id: '20.2', title: 'FAZENDA - Réu GDF - servidor INATIVO - Exercícios findos não pagos', order: '20.2', files: [] },
        { id: '20.3', title: 'FAZENDA – Réu GDF - servidor ATIVO – Reconhecimento de gratificação', order: '20.3', files: [] },
        { id: '20.4', title: 'FAZENDA – Réu GDF – NÃO fornecimento de medicação – Ressarcimento', order: '20.4', files: [] },
        { id: '20.5', title: 'FAZENDA – Réu GDF – Saúde – CIRURGIA - Tutela de URGÊNCIA', order: '20.5', files: [] },
        { id: '20.6', title: 'FAZENDA – Réu GDF – Saúde – EXAME - Tutela de URGÊNCIA', order: '20.6', files: [] },
        { id: '20.7', title: 'FAZENDA – Réu GDF – Saúde – MEDICAMENTO - Tutela de URGÊNCIA', order: '20.7', files: [] },
        { id: '20.8', title: 'FAZENDA – Réu GDF – Saúde – TRATAMENTO - Tutela de URGÊNCIA', order: '20.8', files: [] },
        { id: '20.9', title: 'FAZENDA – Réu GDF-DER–NOVACAP - BURACO NA PISTA – ressarcimento de custo', order: '20.9', files: [] },
        { id: '20.10', title: 'FAZENDA – Réu GDF-NOVACAP – BURACO NA PISTA – ressarcimento de custo', order: '20.10', files: [] },
        { id: '20.11', title: 'FAZENDA – Réu GDF-DETRAN – BAIXA DE REGISTRO DE VEÍCULO – débitos de IPVA', order: '20.11', files: [] },
        { id: '20.12.0', title: 'FAZENDA – Réu GDF-DETRAN – Venda de Veículo – NEGATIVA de PROPRIEDADE – Débitos de IPVA', order: '20.12.0', files: [] },
        { id: '20.12.1', title: 'FAZENDA – Réu DETRAN – Venda de Veículo – Comunicado de venda - NEGATIVA de PROPRIEDADE', order: '20.12.1', files: [] },
        { id: '20.13', title: 'FAZENDA – Réu DER - DETRAN – NULIDADE DE MULTA', order: '20.13', files: [] },
        { id: '20.14', title: 'FAZENDA – Réu DETRAN – NULIDADE DE MULTA', order: '20.14', files: [] },
        { id: '20.15', title: 'FAZENDA – Réu DER – NULIDADE DE MULTA', order: '20.15', files: [] },
        { id: '20.16', title: 'FAZENDA – Réu DER-DETRAN – NULIDADE DE MULTA – falta de NOTIFICAÇÃO', order: '20.16', files: [] },
        { id: '20.17', title: 'FAZENDA – Réu DETRAN – NULIDADE DE MULTA – falta de NOTIFICAÇÃO', order: '20.17', files: [] },
        { id: '20.18', title: 'FAZENDA – Réu DER – NULIDADE DE MULTA – falta de NOTIFICAÇÃO', order: '20.18', files: [] },
        { id: '20.19', title: 'FAZENDA – Réu DETRAN – BAIXA DE REGISTRO DE VEÍCULO', order: '20.19', files: [] },
        { id: '20.20', title: 'FAZENDA – Réu DETRAN – CLONAGEM de PLACA – NULIDADE DE MULTA', order: '20.20', files: [] },
        { id: '20.21', title: 'FAZENDA – Réu DER-DETRAN – CNH - Transferência de PONTUAÇÃO', order: '20.21', files: [] },
        { id: '20.22', title: 'FAZENDA – Réu DER – CNH - Transferência de PONTUAÇÃO', order: '20.22', files: [] },
        { id: '20.23', title: 'FAZENDA – Réu DETRAN – CNH - Transferência de PONTUAÇÃO', order: '20.23', files: [] },
        { id: '20.24', title: 'FAZENDA – Réu DETRAN – CNH Definitiva – Negativa de RENOVAÇÃO', order: '20.24', files: [] },
        { id: '20.25', title: 'FAZENDA – Réu DETRAN – CNH Definitiva – inclusão EAR - demora de RENOVAÇÃO', order: '20.25', files: [] },
        { id: '20.26', title: 'FAZENDA – Réu DETRAN – CNH Provisória – Negativa da DEFINITIVA', order: '20.26', files: [] },
        { id: '20.27', title: 'FAZENDA – Réu DF-DETRAN – Venda de Veículo – NULIDADE de PROPRIEDADE - negativação indevida – DANOS MORAIS - tutela de urgência', order: '20.27', files: [] },
        { id: '20.28', title: 'FAZENDA – Réu GDF – Cidadão – Excesso de tributo – ITBI – restituição da diferença', order: '20.28', files: [] },
        { id: '20.29', title: 'ORIENTAÇÕES', order: '20.29', files: [] },
      ]
    },
    {
      id: '21',
      title: 'AÇÕES CONTRA CAESB e CEB',
      order: '21',
      isOpen: false,
      items: [
        { id: '21.1', title: 'CAESB – AUMENTO SUBSTANCIAL – CONTAS PAGAS - CAÇA-VAZAMENTOS - DEVOLUÇÃO EM DOBRO', order: '21.1', files: [] },
        { id: '21.2', title: 'CAESB – AUMENTO SUBSTANCIAL - CONTAS NÃO PAGAS – CORTE DE ÁGUA - Tutela de Urgência', order: '21.2', files: [] },
        { id: '21.3', title: 'CAESB – AUMENTO SUBSTANCIAL - CONTAS NÃO PAGAS – AMEAÇA DE CORTE - Tutela de Urgência', order: '21.3', files: [] },
        { id: '21.4', title: 'CAESB – MULTA INDEVIDA – CONTA PAGA - DEVOLUÇÃO EM DOBRO', order: '21.4', files: [] },
        { id: '21.5', title: 'CAESB – MULTA INDEVIDA - CONTAS NÃO PAGAS – CORTE DE ÁGUA - Tutela de Urgência', order: '21.5', files: [] },
        { id: '21.6', title: 'CAESB – MULTA INDEVIDA – CONTAS NÃO PAGAS – AMEAÇA DE CORTE - Tutela de Urgência', order: '21.6', files: [] },
        { id: '21.7', title: 'CEB – AUMENTO SUBSTANCIAL – CONTAS PAGAS – DEVOLUÇÃO EM DOBRO', order: '21.7', files: [] },
        { id: '21.8', title: 'CEB – AUMENTO SUBSTANCIAL – CONTAS NÃO PAGAS – CORTE DE ENERGIA - Tutela de Urgência', order: '21.8', files: [] },
        { id: '21.9', title: 'CEB – AUMENTO SUBSTANCIAL – CONTAS NÃO PAGAS – AMEAÇA DE CORTE - Tutela de Urgência', order: '21.9', files: [] },
        { id: '21.10', title: 'CEB – Queda de ENERGIA – DANO EQUIPAMENTO ELÉTRICO - INDENIZAÇÃO', order: '21.10', files: [] },
      ]
    },
    {
      id: '22',
      title: 'COMPRA E VENDA ENTRE PARTICULARES',
      order: '22',
      isOpen: false,
      items: [
        { id: '22.1', title: 'COMPRA E VENDA – falta de pagamento – rescisão de contrato – devolução do bem', order: '22.1', files: [] },
      ]
    },
    {
      id: '23',
      title: 'CONSÓRCIO',
      order: '23',
      isOpen: false,
      items: [
        { id: '23.1', title: 'CONSÓRCIO – Desistência Contratual – RESTITUIÇÃO dos valores pagos', order: '23.1', files: [] },
      ]
    }
  ]);

  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemOrder, setNewItemOrder] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, isOpen: !cat.isOpen } : cat
    ));
  };

  const addNewCategory = () => {
    if (!newCategoryTitle.trim()) {
      toast.error('Digite o título da categoria');
      return;
    }

    const nextOrder = (categories.length + 1).toString();
    const newCategory: Category = {
      id: Date.now().toString(),
      title: newCategoryTitle,
      order: nextOrder,
      items: [],
      isOpen: true
    };

    setCategories([...categories, newCategory]);
    setNewCategoryTitle('');
    setIsAddCategoryOpen(false);
    toast.success('Categoria adicionada com sucesso');
  };

  const addNewItem = () => {
    if (!newItemTitle.trim() || !newItemOrder.trim() || !selectedCategoryId) {
      toast.error('Preencha todos os campos');
      return;
    }

    const newItem: CategoryItem = {
      id: Date.now().toString(),
      title: newItemTitle,
      order: newItemOrder,
      files: []
    };

    setCategories(categories.map(cat => 
      cat.id === selectedCategoryId 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ));

    // Adicionar como template no sistema
    const category = categories.find(cat => cat.id === selectedCategoryId);
    if (category) {
      onAddTemplate(category.title, newItemTitle, newItemOrder);
    }

    setNewItemTitle('');
    setNewItemOrder('');
    setSelectedCategoryId('');
    setIsAddItemOpen(false);
    toast.success('Item adicionado com sucesso');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      toast.error('Apenas arquivos PDF e DOCX são permitidos');
      return;
    }

    try {
      // Encontrar o item e categoria
      let foundItem: CategoryItem | null = null;
      let foundCategory: Category | null = null;

      for (const category of categories) {
        const item = category.items.find(i => i.id === itemId);
        if (item) {
          foundItem = item;
          foundCategory = category;
          break;
        }
      }

      if (!foundItem || !foundCategory) {
        toast.error('Item não encontrado');
        return;
      }

      // Primeiro, criar o template no banco se não existir
      await onAddTemplate(foundCategory.title, foundItem.title, foundItem.order);
      
      // Depois fazer upload do arquivo
      await onFileUpload(itemId, file);
      
      // Atualizar o estado local
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' : 'docx' as 'pdf' | 'docx',
        url: URL.createObjectURL(file)
      };

      setCategories(categories.map(cat => 
        cat.id === foundCategory!.id 
          ? {
              ...cat,
              items: cat.items.map(item => 
                item.id === itemId 
                  ? { ...item, files: [...item.files, newFile] }
                  : item
              )
            }
          : cat
      ));

      toast.success('Arquivo enviado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar arquivo');
    }

    event.target.value = '';
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado');
  };

  const handleOpenFile = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
    toast.success(`Abrindo ${fileName}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Categorias de Modelos</h3>
        <div className="flex gap-2">
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.order}. {cat.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ordem</label>
                  <Input
                    value={newItemOrder}
                    onChange={(e) => setNewItemOrder(e.target.value)}
                    placeholder="Ex: 16.1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Título do item"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addNewItem}>Adicionar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Título da Categoria</label>
                  <Input
                    value={newCategoryTitle}
                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                    placeholder="Ex: DIREITO PREVIDENCIÁRIO"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addNewCategory}>Adicionar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <Card key={category.id}>
            <Collapsible open={category.isOpen} onOpenChange={() => toggleCategory(category.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {category.isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <FolderOpen className="h-4 w-4" />
                      {category.order}. {category.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {category.items.length} itens
                    </Badge>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.order}</span>
                          <span className="text-sm">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.files.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {item.files.length} arquivo(s)
                            </Badge>
                          )}
                          
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.docx"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, item.id)}
                            />
                            <Button variant="ghost" size="sm" asChild>
                              <span title="Adicionar arquivo">
                                <Upload className="h-4 w-4" />
                              </span>
                            </Button>
                          </label>
                          
                          {/* Lista de arquivos com botões de download e abrir */}
                          {item.files.map((file) => (
                            <div key={file.id} className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadFile(file.url, file.name)}
                                title={`Download ${file.name}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenFile(file.url, file.name)}
                                title={`Abrir ${file.name}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};
