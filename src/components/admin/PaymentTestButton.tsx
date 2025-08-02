import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PaymentTestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const simulatePayment = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Buscar o último pagamento pendente do usuário
      const { data: payment, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !payment) {
        toast.error('Nenhum pagamento pendente encontrado');
        return;
      }

      // Confirmar o pagamento
      const { error: updateError } = await supabase
        .from('pagamentos')
        .update({ status: 'confirmed' })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      // Ativar assinatura
      const nextPayment = new Date();
      nextPayment.setMonth(nextPayment.getMonth() + 1);

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          assinatura_ativa: true,
          aprovado_por_admin: true,
          data_aprovacao: new Date().toISOString(),
          proximo_pagamento: nextPayment.toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast.success('Pagamento confirmado e assinatura ativada!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={simulatePayment}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? 'Processando...' : 'Simular Pagamento (DEV)'}
    </Button>
  );
};