import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, CreditCard, UserCheck, Shield } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
}

interface UserStatus {
  hasAccess: boolean;
  isAdmin: boolean;
  isApprovedByAdmin: boolean;
  role: string;
  subscriptionActive: boolean;
  nextPayment: string | null;
  statusMessage: string;
  statusType: 'loading' | 'active' | 'pending_payment' | 'pending_approval' | 'access_denied';
}

/**
 * SubscriptionGuard - Component to check if user has active subscription and admin approval
 * Redirects to subscription page if user doesn't have access
 */
const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    hasAccess: false,
    isAdmin: false,
    isApprovedByAdmin: false,
    role: 'user',
    subscriptionActive: false,
    nextPayment: null,
    statusMessage: '',
    statusType: 'loading'
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setIsCheckingSubscription(false);
        return;
      }

      try {
        // Check user subscription status with all new fields
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('assinatura_ativa, proximo_pagamento, role, aprovado_por_admin')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking subscription:', error);
          setUserStatus(prev => ({
            ...prev,
            hasAccess: false,
            statusType: 'access_denied',
            statusMessage: 'Erro ao verificar status da conta'
          }));
          setIsCheckingSubscription(false);
          return;
        }

        const isAdmin = profile?.role === 'admin';
        const isActive = profile?.assinatura_ativa;
        const isApproved = profile?.aprovado_por_admin;
        const nextPayment = profile?.proximo_pagamento;
        const isExpired = nextPayment ? new Date(nextPayment) < new Date() : false;

        // Determine access and status
        let hasAccess = false;
        let statusType: UserStatus['statusType'] = 'access_denied';
        let statusMessage = '';

        if (isAdmin) {
          hasAccess = true;
          statusType = 'active';
          statusMessage = 'Acesso administrativo ativo';
        } else if (isActive && !isExpired) {
          hasAccess = true;
          statusType = 'active';
          statusMessage = 'Assinatura ativa';
        } else if (!isActive || isExpired) {
          statusType = 'pending_payment';
          statusMessage = 'Pagamento pendente ou assinatura expirada';
        } else if (!isApproved) {
          statusType = 'pending_approval';
          statusMessage = 'Aguardando aprovação administrativa';
        }

        setUserStatus({
          hasAccess,
          isAdmin: isAdmin || false,
          isApprovedByAdmin: isApproved || false,
          role: profile?.role || 'user',
          subscriptionActive: isActive || false,
          nextPayment,
          statusMessage,
          statusType
        });
      } catch (error) {
        console.error('Error checking subscription:', error);
        setUserStatus(prev => ({
          ...prev,
          hasAccess: false,
          statusType: 'access_denied',
          statusMessage: 'Erro ao verificar status da conta'
        }));
      } finally {
        setIsCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Show loading while checking auth and subscription
  if (isLoading || isCheckingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Redirect to subscription page if user doesn't have access
  if (!userStatus.hasAccess) {
    return <Navigate to="/assinatura" replace />;
  }

  // Render the protected component
  return <>{children}</>;
};

export default SubscriptionGuard;