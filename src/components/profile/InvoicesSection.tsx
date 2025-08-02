import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Download, Receipt } from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  valor: number;
  status: string;
  metodo_pagamento: string;
  created_at: string;
  assinatura_id: string;
}

const InvoicesSection = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invoices:', error);
        toast.error('Erro ao carregar faturas');
        return;
      }

      setInvoices(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            Pago
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pendente
          </Badge>
        );
      case 'cancelled':
      case 'failed':
        return (
          <Badge variant="destructive">
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateReceipt = (invoice: Invoice) => {
    const receiptContent = `
COMPROVANTE DE PAGAMENTO
========================

Cliente: ${user?.user_metadata?.full_name || user?.email}
Data: ${formatDate(invoice.created_at)}
Valor: ${formatCurrency(invoice.valor)}
Status: ${invoice.status === 'confirmed' ? 'PAGO' : invoice.status.toUpperCase()}
Método: ${invoice.metodo_pagamento || 'Não informado'}
ID da Transação: ${invoice.id}
ID da Assinatura: ${invoice.assinatura_id || 'Não informado'}

Este comprovante serve como prova de pagamento
para os serviços contratados.

========================
Praxis - Sistema Jurídico
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprovante-${invoice.id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Comprovante baixado com sucesso');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Faturas e Comprovantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Faturas e Comprovantes
        </CardTitle>
        <CardDescription>
          Histórico de pagamentos e comprovantes fiscais para download
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma fatura encontrada</p>
            <p className="text-sm">Suas faturas aparecerão aqui quando você realizar pagamentos</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.valor)}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {invoice.metodo_pagamento || 'Não informado'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(invoice.status === 'confirmed' || invoice.status === 'paid') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateReceipt(invoice)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Comprovante
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoicesSection;