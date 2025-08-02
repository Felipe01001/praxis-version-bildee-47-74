import { Link, useLocation } from 'react-router-dom';
import { Calendar, ChevronLeft, Folder, Home, Plus, Search, User, FileText, Settings, Palette, CheckCircle, File, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS } from '@/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/context/ThemeContext';
import { SubscriptionAccessWrapper } from '@/components/subscription/SubscriptionAccessWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}
const Sidebar = ({
  isOpen = false,
  onClose
}: SidebarProps) => {
  const location = useLocation();
  const {
    headerColor,
    textColor,
    caseStatusColors,
    taskStatusColors,
    setCaseStatusColor,
    setTaskStatusColor,
    currentStatusView,
    setCurrentStatusView,
    caseStatusTextColors,
    setCaseStatusTextColor
  } = useTheme();
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  const navigationItems = [{
    name: 'Dashboard',
    path: '/',
    icon: <Home className="h-5 w-5" />
  }, {
    name: 'Clientes',
    path: '/clients',
    icon: <User className="h-5 w-5" />
  }, {
    name: 'Atendimentos',
    path: '/cases',
    icon: <Folder className="h-5 w-5" />
  }, {
    name: 'Processos Judiciais',
    path: '/judicial-processes',
    icon: <FileText className="h-5 w-5" />
  }, {
    name: 'Tarefas',
    path: '/tasks',
    icon: <CheckCircle className="h-5 w-5" />
  }, {
    name: 'Petições',
    path: '/petitions',
    icon: <File className="h-5 w-5" />
  }, {
    name: 'Legislação',
    path: '/legislation',
    icon: <Scale className="h-5 w-5" />
  }, {
    name: 'Agenda',
    path: '/calendar',
    icon: <Calendar className="h-5 w-5" />
  }, {
    name: 'Busca',
    path: '/search',
    icon: <Search className="h-5 w-5" />
  }];

  // Apply conditional classes based on isOpen prop for mobile
  const sidebarClasses = cn(`${textColor} w-64 flex flex-col h-screen`, "md:relative",
  // Always visible on desktop
  isOpen ? "fixed inset-y-0 left-0 z-30" : "hidden md:flex" // Conditional for mobile
  );

  // Get the current status colors based on the view
  const currentStatusColors = currentStatusView === 'cases' ? caseStatusColors : taskStatusColors;

  // Handle color change
  const handleColorChange = (status: keyof typeof currentStatusColors, color: string) => {
    if (currentStatusView === 'cases') {
      setCaseStatusColor(status, color);
    } else {
      setTaskStatusColor(status, color);
    }
  };

  // Handle text color change for case status
  const handleTextColorChange = (status: keyof typeof caseStatusTextColors, color: string) => {
    setCaseStatusTextColor(status, color);
  };
  return <aside className={sidebarClasses} style={{
    backgroundColor: headerColor
  }}>
      <div className="flex items-center justify-between p-4">
        <Link to="/" className={`text-2xl font-bold ${textColor}`}>
          Praxis
        </Link>
        
        {/* Close button - only visible on mobile when sidebar is open */}
        <Button variant="ghost" size="icon" onClick={onClose} className={textColor}>
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Fechar menu</span>
        </Button>
      </div>
      
      <SubscriptionAccessWrapper action="criar um novo cliente">
        <Button asChild className="mx-4 bg-praxis-light-orange hover:bg-praxis-light-orange/90 text-white mb-6">
          <Link to="/clients/new" className="flex items-center gap-2 mx-[21px]">
            <Plus className="h-4 w-4" />
            <span>Novo Cliente</span>
          </Link>
        </Button>
      </SubscriptionAccessWrapper>
      
      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-2 mb-6">
          {navigationItems.map(item => {
          return <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-4 py-3 rounded-md transition-colors", isActive(item.path) ? "bg-white/20 text-white" : `hover:bg-white/10 ${textColor}`)}>
                {item.icon}
                <span>{item.name}</span>
              </Link>;
        })}
        </nav>
        
        <div className="border-t border-white/20 pt-4 mb-6">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <h4 className={`font-medium ${textColor}`}>Personalizar Tema</h4>
              <Button variant="ghost" size="icon" className={`${textColor} hover:bg-white/10 h-7 w-7`}>
                <Palette className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs defaultValue="cases" value={currentStatusView} onValueChange={value => setCurrentStatusView(value as 'cases' | 'tasks')} className="mt-4">
              <TabsList className="w-full grid grid-cols-2 bg-white/10">
                <TabsTrigger value="cases" className={`${textColor} data-[state=active]:bg-white/20`}>Atendimentos</TabsTrigger>
                <TabsTrigger value="tasks" className={`${textColor} data-[state=active]:bg-white/20`}>Tarefas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cases" className="mt-4 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-2">
                    <span className={`text-xs uppercase font-medium ${textColor}`}>Finalizado</span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{
                        backgroundColor: caseStatusColors['completed']
                      }}></div>
                        <span className={textColor}>{STATUS_LABELS['completed']}</span>
                      </div>
                      <label className={`text-xs ${textColor}`}>Cor de fundo:</label>
                      <Input type="color" value={caseStatusColors['completed']} onChange={e => handleColorChange('completed', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                      <label className={`text-xs mt-1 ${textColor}`}>Cor do texto:</label>
                      <Input type="color" value={caseStatusTextColors['completed']} onChange={e => handleTextColorChange('completed', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                    </div>
                  </div>
                  
                  <Separator className="bg-white/20" />
                  
                  <div className="flex flex-col gap-2">
                    <span className={`text-xs uppercase font-medium ${textColor}`}>Em tramitação</span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{
                        backgroundColor: caseStatusColors['in-progress']
                      }}></div>
                        <span className={textColor}>{STATUS_LABELS['in-progress']}</span>
                      </div>
                      <label className={`text-xs ${textColor}`}>Cor de fundo:</label>
                      <Input type="color" value={caseStatusColors['in-progress']} onChange={e => handleColorChange('in-progress', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                      <label className={`text-xs mt-1 ${textColor}`}>Cor do texto:</label>
                      <Input type="color" value={caseStatusTextColors['in-progress']} onChange={e => handleTextColorChange('in-progress', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                    </div>
                  </div>
                  
                  <Separator className="bg-white/20" />
                  
                  <div className="flex flex-col gap-2">
                    <span className={`text-xs uppercase font-medium ${textColor}`}>Atrasado</span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{
                        backgroundColor: caseStatusColors['delayed']
                      }}></div>
                        <span className={textColor}>{STATUS_LABELS['delayed']}</span>
                      </div>
                      <label className={`text-xs ${textColor}`}>Cor de fundo:</label>
                      <Input type="color" value={caseStatusColors['delayed']} onChange={e => handleColorChange('delayed', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                      <label className={`text-xs mt-1 ${textColor}`}>Cor do texto:</label>
                      <Input type="color" value={caseStatusTextColors['delayed']} onChange={e => handleTextColorChange('delayed', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                    </div>
                  </div>
                  
                  <Separator className="bg-white/20" />
                  
                  <div className="flex flex-col gap-2">
                    <span className={`text-xs uppercase font-medium ${textColor}`}>Em análise</span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{
                        backgroundColor: caseStatusColors['analysis']
                      }}></div>
                        <span className={textColor}>{STATUS_LABELS['analysis']}</span>
                      </div>
                      <label className={`text-xs ${textColor}`}>Cor de fundo:</label>
                      <Input type="color" value={caseStatusColors['analysis']} onChange={e => handleColorChange('analysis', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                      <label className={`text-xs mt-1 ${textColor}`}>Cor do texto:</label>
                      <Input type="color" value={caseStatusTextColors['analysis']} onChange={e => handleTextColorChange('analysis', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-4 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: taskStatusColors['completed']
                    }}></div>
                      <span className={textColor}>{STATUS_LABELS['completed']}</span>
                    </div>
                    <Input type="color" value={taskStatusColors['completed']} onChange={e => handleColorChange('completed', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: taskStatusColors['in-progress']
                    }}></div>
                      <span className={textColor}>{STATUS_LABELS['in-progress']}</span>
                    </div>
                    <Input type="color" value={taskStatusColors['in-progress']} onChange={e => handleColorChange('in-progress', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: taskStatusColors['delayed']
                    }}></div>
                      <span className={textColor}>{STATUS_LABELS['delayed']}</span>
                    </div>
                    <Input type="color" value={taskStatusColors['delayed']} onChange={e => handleColorChange('delayed', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: taskStatusColors['analysis']
                    }}></div>
                      <span className={textColor}>{STATUS_LABELS['analysis']}</span>
                    </div>
                    <Input type="color" value={taskStatusColors['analysis']} onChange={e => handleColorChange('analysis', e.target.value)} className="w-full h-6 p-0 cursor-pointer" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </aside>;
};
export default Sidebar;