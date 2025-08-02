
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserRound } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
      <Button asChild className="bg-praxis-olive hover:bg-praxis-olive/90">
        <Link to="/clients/new" className="flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          <span>Novo Cliente</span>
        </Link>
      </Button>
    </div>
  );
};

export default DashboardHeader;
