
import { useParams, useNavigate } from 'react-router-dom';
import { usePraxisContext } from '@/context/PraxisContext';
import { ConsultationTimeline } from '@/components/consultation/ConsultationTimeline';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CaseTimelinePage = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { 
    cases, 
    clients, 
    attachments, 
    tasks, 
    judicialProcesses 
  } = usePraxisContext();
  
  // Find case by ID
  const caseItem = cases.find(c => c.id === caseId);
  
  // If case not found, show error and return button
  if (!caseItem) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Atendimento não encontrado</h2>
        <p className="text-muted-foreground mb-6">O atendimento que você está procurando não existe ou foi removido.</p>
        <Button 
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }
  
  // Find client associated with this case
  const client = clients.find(c => c.id === caseItem.clientId);
  
  // Get data related to this case - filter by caseId if it exists
  const caseAttachments = attachments.filter(a => a.caseId === caseId);
  const caseTasks = tasks.filter(t => t.caseId === caseId);
  const caseJudicialProcesses = judicialProcesses.filter(p => p.caseId === caseId);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Linha do Tempo do Atendimento</h1>
          <p className="text-muted-foreground">
            {client ? `Cliente: ${client.name}` : 'Cliente não encontrado'}
          </p>
        </div>
      </div>
      
      <ConsultationTimeline
        consultationId={caseItem.id}
        createdAt={caseItem.createdAt}
        status={caseItem.status}
        clientId={caseItem.clientId}
        clientName={client?.name || 'Cliente não encontrado'}
        description={caseItem.description || ''}
        attachments={caseAttachments}
        tasks={caseTasks}
        judicialProcesses={caseJudicialProcesses}
      />
    </div>
  );
};

export default CaseTimelinePage;
