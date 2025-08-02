
import { useParams, useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { ClientEditForm } from '@/components/client/ClientEditForm';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ClientEditPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { clients, updateClient } = usePraxisContext();
  
  // Find client by ID
  const client = clients.find(c => c.id === clientId);
  
  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Cliente não encontrado</h2>
        <p className="text-muted-foreground mb-6">O cliente que você está procurando não existe ou foi removido.</p>
        <Button 
          variant="outline"
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista de clientes
        </Button>
      </div>
    );
  }
  
  const handleUpdate = (updatedClient: typeof client) => {
    // Ensure status is set (default to active if not provided)
    const clientWithStatus = {
      ...updatedClient,
      status: updatedClient.status || 'active'
    };
    
    updateClient(clientWithStatus);
    toast.success('Cliente atualizado com sucesso');
    navigate(`/clients/${clientId}`);
  };
  
  const handleCancel = () => {
    navigate(`/clients/${clientId}`);
  };
  
  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleCancel}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o perfil do cliente
      </Button>
      
      <ClientEditForm 
        client={client}
        onSave={handleUpdate}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ClientEditPage;
