import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, CheckCircle, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
import { Status } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { STATUS_LABELS } from '@/constants';
import { useIsMobile } from '@/hooks/use-mobile';

interface CasesStatusCardProps {
  completedCases: number;
  inProgressCases: number;
  delayedCases: number;
  analysisCases: number;
}

const CasesStatusCard = ({ 
  completedCases, 
  inProgressCases, 
  delayedCases, 
  analysisCases 
}: CasesStatusCardProps) => {
  const navigate = useNavigate();
  const { caseStatusColors, caseStatusTextColors } = useTheme();
  const isMobile = useIsMobile();
  
  const navigateToFilteredCases = (status: Status) => {
    navigate('/cases', { state: { statusFilter: status } });
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={isMobile ? 16 : 20} />;
      case 'in-progress':
        return <Clock size={isMobile ? 16 : 20} />;
      case 'delayed':
        return <AlertTriangle size={isMobile ? 16 : 20} />;
      case 'analysis':
        return <HelpCircle size={isMobile ? 16 : 20} />;
    }
  };

  const renderStatusBox = (status: Status, count: number) => {
    return (
      <div 
        className="rounded-lg p-4 cursor-pointer hover:brightness-95 transition-all"
        style={{ 
          backgroundColor: caseStatusColors[status],
          color: caseStatusTextColors[status]
        }}
        onClick={() => navigateToFilteredCases(status)}
      >
        <div className="flex items-center gap-3">
          <div className={`${isMobile ? "h-8 w-8" : "h-10 w-10"} flex items-center justify-center rounded-full bg-white/20`}>
            {getStatusIcon(status)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{STATUS_LABELS[status]}</span>
            <span className="text-xl md:text-2xl font-bold">{count}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-praxis-olive" />
          Status dos Atendimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {renderStatusBox('completed', completedCases)}
          {renderStatusBox('in-progress', inProgressCases)}
          {renderStatusBox('delayed', delayedCases)}
          {renderStatusBox('analysis', analysisCases)}
        </div>
      </CardContent>
    </Card>
  );
};

export default CasesStatusCard;
