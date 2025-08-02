import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Edit3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Petition } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
interface PetitionsCardProps {
  clientId?: string;
  petitions?: Petition[];
}
const PetitionsCard = ({
  clientId,
  petitions = []
}: PetitionsCardProps) => {
  const {
    headerColor
  } = useTheme();

  // Get category text
  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      'civil': 'Cível',
      'criminal': 'Criminal',
      'social-security': 'Previdenciário',
      'labor': 'Trabalhista',
      'administrative': 'Administrativo'
    };
    return categories[category] || category;
  };

  // Get preview text
  const getPreviewText = (content: string, maxLength: number = 80) => {
    const cleanText = content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '');
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };
  return <Card className="h-full">
      
      
    </Card>;
};
export default PetitionsCard;