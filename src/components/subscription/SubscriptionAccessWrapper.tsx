import { ReactNode, useState } from 'react';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { InactiveSubscriptionGuard } from './InactiveSubscriptionGuard';

interface SubscriptionAccessWrapperProps {
  children: ReactNode;
  action: string;
  onAccessDenied?: () => void;
}

/**
 * Wrapper component que protege funcionalidades para usuários com assinatura inativa
 * Mostra um popup amigável quando necessário
 */
export const SubscriptionAccessWrapper = ({ 
  children, 
  action, 
  onAccessDenied 
}: SubscriptionAccessWrapperProps) => {
  const { hasAccess, isLoading } = useSubscriptionAccess();
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = async (event: React.MouseEvent) => {
    if (isLoading) return;

    if (!hasAccess) {
      event.preventDefault();
      event.stopPropagation();
      setShowDialog(true);
      onAccessDenied?.();
      return;
    }
  };

  return (
    <div onClick={handleClick}>
      <InactiveSubscriptionGuard
        action={action}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
      >
        {children}
      </InactiveSubscriptionGuard>
    </div>
  );
};

export default SubscriptionAccessWrapper;