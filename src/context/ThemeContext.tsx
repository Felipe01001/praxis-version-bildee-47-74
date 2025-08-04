import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { STATUS_COLORS } from '@/constants';
import { Status } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Type for status colors
type StatusColorsType = {
  completed: string;
  'in-progress': string;
  delayed: string;
  analysis: string;
};

// Type for status text colors
type StatusTextColorsType = {
  completed: string;
  'in-progress': string;
  delayed: string;
  analysis: string;
};

// Type for theme settings from database
type ThemeSettings = {
  headerColor?: string;
  avatarColor?: string;
  textColor?: string;
  mainColor?: string;
  buttonColor?: string;
  caseStatusColors?: StatusColorsType;
  taskStatusColors?: StatusColorsType;
  caseStatusTextColors?: StatusTextColorsType;
};

interface ThemeContextProps {
  headerColor: string;
  setHeaderColor: (color: string) => void;
  avatarColor: string;
  setAvatarColor: (color: string) => void;
  textColor: string; 
  setTextColor: (color: string) => void;
  mainColor: string;
  setMainColor: (color: string) => void;
  buttonColor: string;
  setButtonColor: (color: string) => void;
  caseStatusColors: StatusColorsType;
  setCaseStatusColor: (status: keyof StatusColorsType, color: string) => void;
  taskStatusColors: StatusColorsType;
  setTaskStatusColor: (status: keyof StatusColorsType, color: string) => void;
  caseStatusTextColors: StatusTextColorsType;
  setCaseStatusTextColor: (status: keyof StatusTextColorsType, color: string) => void;
  currentStatusView: 'cases' | 'tasks';
  setCurrentStatusView: (view: 'cases' | 'tasks') => void;
}

// Default color values for status - these match the palette from the design
const DEFAULT_STATUS_COLORS: StatusColorsType = {
  'completed': '#F2FCE2', // Soft Green
  'in-progress': '#D3E4FD', // Soft Blue
  'delayed': '#FFCCCB', // More intense red for delayed
  'analysis': '#FEF7CD', // Soft Yellow
};

// Default text color for status
const DEFAULT_TEXT_COLORS: StatusTextColorsType = {
  'completed': '#1e3a1e', // Dark green
  'in-progress': '#1e3a5a', // Dark blue
  'delayed': '#8B0000', // Darker red for more contrast
  'analysis': '#3a351e', // Dark amber
};

// Extract base color classes from STATUS_COLORS constants
const extractBaseColors = (): StatusColorsType => {
  return {
    'completed': STATUS_COLORS['completed'].match(/bg-([a-z]+-\d+)/)?.[0] || 'bg-green-500',
    'in-progress': STATUS_COLORS['in-progress'].match(/bg-([a-z]+-\d+)/)?.[0] || 'bg-blue-500',
    'delayed': STATUS_COLORS['delayed'].match(/bg-([a-z]+-\d+)/)?.[0] || 'bg-red-500',
    'analysis': STATUS_COLORS['analysis'].match(/bg-([a-z]+-\d+)/)?.[0] || 'bg-amber-400'
  };
};

// Check if a color is light or dark
export const isLightColor = (hexColor: string): boolean => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance - using the formula for relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if light, false if dark
  return luminance > 0.5;
};

const ThemeContext = createContext<ThemeContextProps>({
  headerColor: '#8B9474', // Verde oliva padrão
  setHeaderColor: () => {},
  avatarColor: '#F5A65B', // Laranja claro padrão
  setAvatarColor: () => {},
  textColor: 'text-white',
  setTextColor: () => {},
  mainColor: '#F3F4F6', // Cinza claro padrão
  setMainColor: () => {},
  buttonColor: '#8B9474', // Verde oliva padrão para botões
  setButtonColor: () => {},
  caseStatusColors: DEFAULT_STATUS_COLORS,
  setCaseStatusColor: () => {},
  taskStatusColors: DEFAULT_STATUS_COLORS,
  setTaskStatusColor: () => {},
  caseStatusTextColors: DEFAULT_TEXT_COLORS,
  setCaseStatusTextColor: () => {},
  currentStatusView: 'cases',
  setCurrentStatusView: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [headerColor, setHeaderColorState] = useState<string>('#8B9474');
  const [avatarColor, setAvatarColorState] = useState<string>('#F5A65B');
  const [textColor, setTextColorState] = useState<string>('text-white');
  const [mainColor, setMainColorState] = useState<string>('#F3F4F6');
  const [buttonColor, setButtonColorState] = useState<string>('#8B9474');
  const [caseStatusColors, setCaseStatusColorsState] = useState<StatusColorsType>(DEFAULT_STATUS_COLORS);
  const [taskStatusColors, setTaskStatusColorsState] = useState<StatusColorsType>(DEFAULT_STATUS_COLORS);
  const [caseStatusTextColors, setCaseStatusTextColorsState] = useState<StatusTextColorsType>(DEFAULT_TEXT_COLORS);
  const [currentStatusView, setCurrentStatusViewState] = useState<'cases' | 'tasks'>('cases');
  const [initialized, setInitialized] = useState(false);

  // Load theme settings from database
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Load from localStorage if not authenticated
          loadFromLocalStorage();
          setInitialized(true);
          return;
        }

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('theme_settings')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading theme settings:', error);
          loadFromLocalStorage();
          setInitialized(true);
          return;
        }

        if (profile?.theme_settings) {
          const settings = profile.theme_settings as ThemeSettings;
          setHeaderColorState(settings.headerColor || '#8B9474');
          setAvatarColorState(settings.avatarColor || '#F5A65B');
          setTextColorState(settings.textColor || 'text-white');
          setMainColorState(settings.mainColor || '#F3F4F6');
          setButtonColorState(settings.buttonColor || '#8B9474');
          setCaseStatusColorsState(settings.caseStatusColors || DEFAULT_STATUS_COLORS);
          setTaskStatusColorsState(settings.taskStatusColors || DEFAULT_STATUS_COLORS);
          setCaseStatusTextColorsState(settings.caseStatusTextColors || DEFAULT_TEXT_COLORS);
        } else {
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
        loadFromLocalStorage();
      }
      setInitialized(true);
    };

    loadThemeSettings();
  }, []);

  const loadFromLocalStorage = () => {
    setHeaderColorState(localStorage.getItem('praxis-header-color') || '#8B9474');
    setAvatarColorState(localStorage.getItem('praxis-avatar-color') || '#F5A65B');
    const storedHeaderColor = localStorage.getItem('praxis-header-color') || '#8B9474';
    setTextColorState(isLightColor(storedHeaderColor) ? 'text-gray-800' : 'text-white');
    setMainColorState(localStorage.getItem('praxis-main-color') || '#F3F4F6');
    setButtonColorState(localStorage.getItem('praxis-button-color') || '#8B9474');
    
    const storedCaseColors = localStorage.getItem('praxis-case-status-colors');
    setCaseStatusColorsState(storedCaseColors ? JSON.parse(storedCaseColors) : DEFAULT_STATUS_COLORS);
    
    const storedTaskColors = localStorage.getItem('praxis-task-status-colors');
    setTaskStatusColorsState(storedTaskColors ? JSON.parse(storedTaskColors) : DEFAULT_STATUS_COLORS);
    
    const storedTextColors = localStorage.getItem('praxis-case-status-text-colors');
    setCaseStatusTextColorsState(storedTextColors ? JSON.parse(storedTextColors) : DEFAULT_TEXT_COLORS);
    
    setCurrentStatusViewState((localStorage.getItem('praxis-status-view') as 'cases' | 'tasks') || 'cases');
  };

  const saveThemeToDatabase = async (newSettings: ThemeSettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .update({ theme_settings: newSettings })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving theme settings:', error);
        toast({
          title: "Erro ao salvar tema",
          description: "Não foi possível salvar as configurações do tema.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  };
  
  const setHeaderColor = (color: string) => {
    setHeaderColorState(color);
    localStorage.setItem('praxis-header-color', color);
    const newTextColor = isLightColor(color) ? 'text-gray-800' : 'text-white';
    setTextColorState(newTextColor);
    
    if (initialized) {
      const newSettings = {
        headerColor: color,
        avatarColor,
        textColor: newTextColor,
        mainColor,
        buttonColor,
        caseStatusColors,
        taskStatusColors,
        caseStatusTextColors
      };
      saveThemeToDatabase(newSettings);
    }
  };
  
  const setAvatarColor = (color: string) => {
    setAvatarColorState(color);
    localStorage.setItem('praxis-avatar-color', color);
    
    if (initialized) {
      const newSettings = {
        headerColor,
        avatarColor: color,
        textColor,
        mainColor,
        buttonColor,
        caseStatusColors,
        taskStatusColors,
        caseStatusTextColors
      };
      saveThemeToDatabase(newSettings);
    }
  };

  const setTextColor = (color: string) => {
    setTextColorState(color);
    localStorage.setItem('praxis-text-color', color);
    
    if (initialized) {
      const newSettings = {
        headerColor,
        avatarColor,
        textColor: color,
        mainColor,
        buttonColor,
        caseStatusColors,
        taskStatusColors,
        caseStatusTextColors
      };
      saveThemeToDatabase(newSettings);
    }
  };
  
  const setMainColor = (color: string) => {
    setMainColorState(color);
    localStorage.setItem('praxis-main-color', color);
    
    if (initialized) {
      const newSettings = {
        headerColor,
        avatarColor,
        textColor,
        mainColor: color,
        buttonColor,
        caseStatusColors,
        taskStatusColors,
        caseStatusTextColors
      };
      saveThemeToDatabase(newSettings);
    }
  };
  
  const setButtonColor = (color: string) => {
    setButtonColorState(color);
    localStorage.setItem('praxis-button-color', color);
    
    if (initialized) {
      const newSettings = {
        headerColor,
        avatarColor,
        textColor,
        mainColor,
        buttonColor: color,
        caseStatusColors,
        taskStatusColors,
        caseStatusTextColors
      };
      saveThemeToDatabase(newSettings);
    }
  };
  
  const setCaseStatusColor = (status: keyof StatusColorsType, color: string) => {
    const newColors = { ...caseStatusColors, [status]: color };
    setCaseStatusColorsState(newColors);
    localStorage.setItem('praxis-case-status-colors', JSON.stringify(newColors));
    
    if (initialized) {
      const newSettings = {
        headerColor,
        avatarColor,
        textColor,
        mainColor,
        buttonColor,
        caseStatusColors: newColors,
        taskStatusColors,
        caseStatusTextColors
      };
      saveThemeToDatabase(newSettings);
    }
  };
  
  const setTaskStatusColor = (status: keyof StatusColorsType, color: string) => {
    const newColors = { ...taskStatusColors, [status]: color };
    setTaskStatusColorsState(newColors);
    localStorage.setItem('praxis-task-status-colors', JSON.stringify(newColors));
    
    if (initialized) {
      const newSettings = {
        headerColor,
        avatarColor,
        textColor,
        mainColor,
        buttonColor,
        caseStatusColors,
        taskStatusColors: newColors,
        caseStatusTextColors
      };
      saveThemeToDatabase(newSettings);
    }
  };

  const setCaseStatusTextColor = (status: keyof StatusTextColorsType, color: string) => {
    const newColors = { ...caseStatusTextColors, [status]: color };
    setCaseStatusTextColorsState(newColors);
    localStorage.setItem('praxis-case-status-text-colors', JSON.stringify(newColors));
    
    if (initialized) {
      const newSettings = {
        headerColor,
        avatarColor,
        textColor,
        mainColor,
        buttonColor,
        caseStatusColors,
        taskStatusColors,
        caseStatusTextColors: newColors
      };
      saveThemeToDatabase(newSettings);
    }
  };
  
  const setCurrentStatusView = (view: 'cases' | 'tasks') => {
    setCurrentStatusViewState(view);
    localStorage.setItem('praxis-status-view', view);
  };
  
  return (
    <ThemeContext.Provider
      value={{
        headerColor,
        setHeaderColor,
        avatarColor,
        setAvatarColor,
        textColor,
        setTextColor,
        mainColor,
        setMainColor,
        buttonColor,
        setButtonColor,
        caseStatusColors,
        setCaseStatusColor,
        taskStatusColors,
        setTaskStatusColor,
        caseStatusTextColors,
        setCaseStatusTextColor,
        currentStatusView,
        setCurrentStatusView,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
