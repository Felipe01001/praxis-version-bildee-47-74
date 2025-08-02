
import { useEffect, useState } from 'react';
import { usePraxisContext } from '@/context/PraxisContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Cloud, CloudOff, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SyncStatus = () => {
  const { isLoading } = usePraxisContext();
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'offline'>('offline');

  useEffect(() => {
    if (!user) {
      setSyncStatus('offline');
      return;
    }

    if (isLoading) {
      setSyncStatus('syncing');
    } else {
      setSyncStatus('synced');
    }
  }, [user, isLoading]);

  if (!user) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CloudOff className="h-3 w-3" />
        Offline
      </Badge>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Sincronizando...
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="flex items-center gap-1 bg-green-600">
      <CheckCircle className="h-3 w-3" />
      Sincronizado
    </Badge>
  );
};
