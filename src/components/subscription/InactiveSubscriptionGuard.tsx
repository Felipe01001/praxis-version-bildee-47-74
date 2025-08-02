import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreditCard, Zap } from 'lucide-react';

interface InactiveSubscriptionGuardProps {
  children: ReactNode;
  action: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente que mostra um popup amigável quando usuários com assinatura inativa
 * tentam usar funcionalidades do sistema
 */
export const InactiveSubscriptionGuard = ({ 
  children, 
  action, 
  isOpen, 
  onClose 
}: InactiveSubscriptionGuardProps) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    onClose();
    navigate('/assinatura');
  };

  return (
    <>
      {children}
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">
              Assinatura Necessária
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Para {action}, você precisa de uma assinatura ativa do PRAXIS.
              <br />
              <br />
              Com a assinatura você terá acesso a todas as funcionalidades:
              <br />
              <div className="flex items-center gap-2 mt-2 justify-center text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Gestão completa de clientes e casos</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel onClick={onClose}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubscribe}
              className="bg-primary hover:bg-primary/90"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Assinar PRAXIS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InactiveSubscriptionGuard;