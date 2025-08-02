
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, LogOut, Lock, UserRound } from 'lucide-react';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    if (user) {
      console.log('UserMenu - User data:', user);
      console.log('UserMenu - User metadata:', user.user_metadata);
      console.log('UserMenu - Avatar URL:', 
        user.user_metadata?.avatar_url || 
        user.user_metadata?.picture || 
        'Nenhum avatar encontrado');
    } else {
      console.log('UserMenu - Usuário não autenticado');
    }
  }, [user]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sessão encerrada com sucesso');
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao encerrar sessão');
    }
  };

  if (!user) {
    console.log('UserMenu - User não encontrado');
    return null;
  }

  // Get user display information
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  
  // Get initials for the avatar fallback
  const getInitials = () => {
    if (user.user_metadata?.full_name) {
      const nameParts = user.user_metadata.full_name.split(' ').filter(part => part.length > 0);
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };
  
  console.log('UserMenu - Display name:', displayName);
  console.log('UserMenu - Initials:', getInitials());
  
  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-2"
        >
          <Avatar className="h-8 w-8 border border-gray-200">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="bg-praxis-olive text-white">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
          {/* Removido o nome para exibir apenas o avatar */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 animate-in fade-in-80 zoom-in-95">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link to="/profile">
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Edit className="h-4 w-4" />
            <span>Editar Perfil</span>
          </DropdownMenuItem>
        </Link>
        <Link to="/change-password">
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Lock className="h-4 w-4" />
            <span>Alterar Senha</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="flex items-center gap-2 text-red-600 cursor-pointer"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
