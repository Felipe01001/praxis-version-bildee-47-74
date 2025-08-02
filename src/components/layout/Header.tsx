
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/auth/UserMenu';
import { SyncStatus } from '@/components/common/SyncStatus';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 
            className="text-2xl font-bold text-praxis-olive cursor-pointer"
            onClick={() => navigate('/')}
          >
            Praxis
          </h1>
          <SyncStatus />
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <NotificationCenter />
              <UserMenu />
            </>
          ) : (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
              >
                Entrar
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-praxis-olive hover:bg-praxis-olive/90"
              >
                Cadastrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
