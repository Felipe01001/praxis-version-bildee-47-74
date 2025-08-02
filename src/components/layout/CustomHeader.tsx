
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderUserSection from "./HeaderUserSection";
import { SearchBar } from "./SearchBar";
import { ThemeCustomizer } from "./ThemeCustomizer";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from '@/context/AuthContext';

interface CustomHeaderProps {
  toggleSidebar: () => void;
}

const CustomHeader = ({ toggleSidebar }: CustomHeaderProps) => {
  const { user } = useAuth();
  const { headerColor, textColor } = useTheme();
  
  return (
    <header 
      className="border-b border-gray-200 py-3 px-4 flex items-center justify-between"
      style={{ backgroundColor: headerColor }}
    >
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`mr-4 hover:bg-white/20 ${textColor}`} 
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <h1 className={`text-xl font-bold ${textColor}`}>Praxis</h1>
      </div>

      {/* Barra de pesquisa - Visível apenas em telas médias ou maiores */}
      <div className="hidden md:flex items-center w-full max-w-md mx-6">
        <SearchBar />
      </div>
      
      <div className="flex items-center gap-2">
        {user && (
          <>
            <NotificationCenter />
            <ThemeCustomizer />
          </>
        )}
        <HeaderUserSection />
      </div>
    </header>
  );
};

export default CustomHeader;
