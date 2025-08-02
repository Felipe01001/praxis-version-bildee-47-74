import { ReactNode, useState, useEffect } from 'react';
import CustomHeader from './CustomHeader';
import Sidebar from './Sidebar';
import { ThemeProvider } from '@/context/ThemeContext';
import { useTheme } from '@/context/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
interface LayoutProps {
  children: ReactNode;
}
const LayoutContent = ({
  children
}: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    mainColor
  } = useTheme();
  const isMobile = useIsMobile();
  const isMediumScreen = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  // Auto-collapse sidebar on medium screens
  useEffect(() => {
    if (isMediumScreen) {
      setSidebarOpen(false);
    } else if (!isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile, isMediumScreen]);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  return <div className="flex flex-col h-screen">
      <CustomHeader toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main style={{
        backgroundColor: mainColor
      }} className="flex-1 overflow-y-auto p-6 px-[8px]">
          {children}
        </main>
      </div>
    </div>;
};

// Hook for responsive media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
};
const Layout = ({
  children
}: LayoutProps) => {
  return <ThemeProvider>
      <LayoutContent>{children}</LayoutContent>
    </ThemeProvider>;
};
export default Layout;