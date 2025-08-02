import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * AdminRoute - Component to check if user has admin role
 * Redirects to dashboard if user is not an admin
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading } = useAuth();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setIsCheckingAdmin(false);
          return;
        }

        setIsAdmin(profile?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Show loading while checking auth and admin status
  if (isLoading || isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // If user is not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render the protected admin component
  return <>{children}</>;
};

export default AdminRoute;