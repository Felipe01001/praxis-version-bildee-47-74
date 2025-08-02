
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback - Starting auth processing');
        console.log('AuthCallback - Current URL:', window.location.href);
        console.log('AuthCallback - Hash:', window.location.hash);
        
        // Para Google OAuth, os tokens vêm no hash fragment
        if (window.location.hash) {
          console.log('AuthCallback - Processing hash fragment for OAuth');
          
          // Aguarda um momento para o Supabase processar automaticamente o hash
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verifica se agora temos uma sessão válida
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthCallback - Error getting session:', sessionError);
            setError('Erro durante autenticação: ' + sessionError.message);
            setProcessing(false);
            return;
          }

          if (sessionData?.session) {
            console.log('AuthCallback - Session found after OAuth, redirecting to dashboard');
            toast.success('Login realizado com sucesso!');
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        // Verifica parâmetros de erro na URL
        const searchParams = new URLSearchParams(location.search);
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        
        if (errorCode) {
          console.error('AuthCallback - Error in callback:', errorDescription);
          setError(errorDescription || 'Erro durante o processo de autenticação');
          setProcessing(false);
          return;
        }

        // Verifica sessão existente (fallback)
        console.log('AuthCallback - Checking for existing session');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('AuthCallback - Error during auth callback:', error);
          setError('Erro durante autenticação: ' + error.message);
          setProcessing(false);
          return;
        }

        if (data?.session) {
          console.log('AuthCallback - Valid session found, redirecting to dashboard');
          toast.success('Login realizado com sucesso!');
          navigate('/dashboard', { replace: true });
        } else {
          console.log('AuthCallback - No session found, redirecting to login');
          setError('Sessão não encontrada. Tente fazer login novamente.');
          setProcessing(false);
        }
      } catch (err) {
        console.error('AuthCallback - Unexpected error:', err);
        setError('Ocorreu um erro inesperado durante a autenticação');
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-6">
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="text-center space-y-4">
            <p>O processo de autenticação encontrou um problema.</p>
            
            <div className="flex flex-col gap-4">
              <Link to="/auth/login">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Tentar Login Novamente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processando autenticação...</h2>
        <div className="flex justify-center">
          <svg className="animate-spin h-8 w-8 text-praxis-olive" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Redirecionando para o dashboard...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
