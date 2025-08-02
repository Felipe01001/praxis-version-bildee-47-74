import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionData {
  assinatura_ativa: boolean;
  proximo_pagamento: string | null;
  data_assinatura: string | null;
  role: string;
}

const SubscriptionSection = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('assinatura_ativa, proximo_pagamento, data_assinatura, role')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
        toast.error('Erro ao carregar dados da assinatura');
        return;
      }

      if (data) {
        setSubscription(data);
        
        // Calculate days remaining
        if (data.proximo_pagamento) {
          const nextPayment = new Date(data.proximo_pagamento);
          const today = new Date();
          const diffTime = nextPayment.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(diffDays);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (subscription?.role === 'admin') {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Administrador
        </Badge>
      );
    }

    if (subscription?.assinatura_ativa) {
      const isExpiring = daysRemaining !== null && daysRemaining <= 7;
      return (
        <Badge variant={isExpiring ? "destructive" : "default"} className={isExpiring ? "" : "bg-green-100 text-green-800 border-green-200"}>
          {isExpiring ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
          {isExpiring ? "Expirando em breve" : "Ativa"}
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Inativa
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinatura
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
          <CreditCard className="h-5 w-5" />
          Assinatura
        </CardTitle>
        <CardDescription>
          Status atual da sua assinatura e informações de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {subscription?.data_assinatura && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Data de contratação:</span>
            <span className="text-sm text-muted-foreground">
              {formatDate(subscription.data_assinatura)}
            </span>
          </div>
        )}

        {subscription?.assinatura_ativa && subscription?.proximo_pagamento && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Próximo pagamento:</span>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {formatDate(subscription.proximo_pagamento)}
                </div>
                {daysRemaining !== null && (
                  <div className={`text-xs ${daysRemaining <= 7 ? 'text-red-600' : 'text-green-600'}`}>
                    {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Vencido'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!subscription?.assinatura_ativa && subscription?.role !== 'admin' && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                Sua assinatura está inativa. Renove para continuar usando todos os recursos.
              </span>
            </div>
            <Button 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.href = '/assinatura'}
            >
              Renovar assinatura
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionSection;