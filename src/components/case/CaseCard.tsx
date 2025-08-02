
import { Case } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface CaseCardProps {
  case: Case;
  onEdit: (caseItem: Case) => void;
  onDelete: (id: string) => void;
}

export const CaseCard = ({ case: caseItem, onEdit, onDelete }: CaseCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {caseItem.category}
        </CardTitle>
        <StatusBadge status={caseItem.status} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {caseItem.description}
        </p>
        {caseItem.subCategory && (
          <p className="text-xs text-muted-foreground mb-2">
            Subcategoria: {caseItem.subCategory}
          </p>
        )}
        <p className="text-xs text-muted-foreground mb-4">
          Criado em: {format(new Date(caseItem.createdAt), 'dd/MM/yyyy')}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(caseItem)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(caseItem.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
