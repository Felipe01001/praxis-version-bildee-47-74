import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { CATEGORY_LABELS } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { ClientStatusBadge } from './ClientStatusBadge';
interface ClientHeaderProps {
  client: Client;
  onDelete: () => void;
  onEdit?: () => void;
}
export const ClientHeader = ({
  client,
  onDelete
}: ClientHeaderProps) => {
  const navigate = useNavigate();
  return <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-praxis-text">{client.name}</h1>
          <ClientStatusBadge status={client.status || 'active'} />
        </div>
        <p className="text-muted-foreground">
          {CATEGORY_LABELS[client.category as keyof typeof CATEGORY_LABELS]} · CPF: {client.cpf}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate(`/clients/${client.id}/edit`)} className="flex items-center gap-1">
          <Edit className="h-4 w-4" />
          Editar Cliente
        </Button>
        
        <Button asChild variant="outline">
          
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Excluir Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Cliente</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>Cancelar</Button>
              <Button variant="destructive" onClick={onDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};