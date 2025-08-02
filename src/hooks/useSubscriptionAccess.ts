import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  hasAccess: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  checkAccess: (action: string) => Promise<boolean>;
}

export const useSubscriptionAccess = (): SubscriptionStatus => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) {
      setHasAccess(false);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('assinatura_ativa, proximo_pagamento, role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error);
        setHasAccess(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const isAdminUser = profile?.role === 'admin';
      const isActive = profile?.assinatura_ativa;
      const nextPayment = profile?.proximo_pagamento;
      const isExpired = nextPayment ? new Date(nextPayment) < new Date() : false;

      // Admin sempre tem acesso
      if (isAdminUser) {
        setHasAccess(true);
        setIsAdmin(true);
      } else {
        // Usuário comum precisa de assinatura ativa e não vencida
        setHasAccess(isActive && !isExpired);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccess = async (action: string): Promise<boolean> => {
    if (isLoading) {
      // Se ainda está carregando, aguarda a verificação
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (!isLoading) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
      });
    }

    return hasAccess;
  };

  return {
    hasAccess,
    isAdmin,
    isLoading,
    checkAccess
  };
};