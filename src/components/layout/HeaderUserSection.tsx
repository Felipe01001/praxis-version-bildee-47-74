
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeaderUserSection = () => {
  const { user, signOut } = useAuth();
  const { avatarColor } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  const getUserInitials = () => {
    if (!user || !user.email) return "?";
    return user.email.charAt(0).toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => navigate("/auth/login")} className="text-white">
          Entrar
        </Button>
        <Button onClick={() => navigate("/auth/signup")} className="bg-white text-praxis-olive hover:bg-white/90">
          Cadastrar
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            {user.user_metadata?.avatar_url ? (
              <AvatarImage
                src={user.user_metadata.avatar_url}
                alt={user.email || "Avatar"}
              />
            ) : (
              <AvatarFallback
                className="text-white"
                style={{ backgroundColor: avatarColor }}
              >
                {getUserInitials()}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || "Usuário"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/change-password")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Alterar senha</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeaderUserSection;
