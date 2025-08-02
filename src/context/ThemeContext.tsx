import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { STATUS_COLORS } from '@/constants';
import { Status } from '@/types';

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
  const [headerColor, setHeaderColorState] = useState<string>(() => {
    return localStorage.getItem('praxis-header-color') || '#8B9474';
  });
  
  const [avatarColor, setAvatarColorState] = useState<string>(() => {
    return localStorage.getItem('praxis-avatar-color') || '#F5A65B';
  });

  const [textColor, setTextColorState] = useState<string>(() => {
    const storedColor = localStorage.getItem('praxis-header-color') || '#8B9474';
    return isLightColor(storedColor) ? 'text-gray-800' : 'text-white';
  });
  
  const [mainColor, setMainColorState] = useState<string>(() => {
    return localStorage.getItem('praxis-main-color') || '#F3F4F6';
  });
  
  const [buttonColor, setButtonColorState] = useState<string>(() => {
    return localStorage.getItem('praxis-button-color') || '#8B9474';
  });
  
  const [caseStatusColors, setCaseStatusColorsState] = useState<StatusColorsType>(() => {
    const stored = localStorage.getItem('praxis-case-status-colors');
    return stored ? JSON.parse(stored) : DEFAULT_STATUS_COLORS;
  });
  
  const [taskStatusColors, setTaskStatusColorsState] = useState<StatusColorsType>(() => {
    const stored = localStorage.getItem('praxis-task-status-colors');
    return stored ? JSON.parse(stored) : DEFAULT_STATUS_COLORS;
  });

  const [caseStatusTextColors, setCaseStatusTextColorsState] = useState<StatusTextColorsType>(() => {
    const stored = localStorage.getItem('praxis-case-status-text-colors');
    return stored ? JSON.parse(stored) : DEFAULT_TEXT_COLORS;
  });
  
  const [currentStatusView, setCurrentStatusViewState] = useState<'cases' | 'tasks'>(() => {
    return (localStorage.getItem('praxis-status-view') as 'cases' | 'tasks') || 'cases';
  });
  
  const setHeaderColor = (color: string) => {
    setHeaderColorState(color);
    localStorage.setItem('praxis-header-color', color);
    setTextColorState(isLightColor(color) ? 'text-gray-800' : 'text-white');
  };
  
  const setAvatarColor = (color: string) => {
    setAvatarColorState(color);
    localStorage.setItem('praxis-avatar-color', color);
  };

  const setTextColor = (color: string) => {
    setTextColorState(color);
    localStorage.setItem('praxis-text-color', color);
  };
  
  const setMainColor = (color: string) => {
    setMainColorState(color);
    localStorage.setItem('praxis-main-color', color);
  };
  
  const setButtonColor = (color: string) => {
    setButtonColorState(color);
    localStorage.setItem('praxis-button-color', color);
  };
  
  const setCaseStatusColor = (status: keyof StatusColorsType, color: string) => {
    const newColors = { ...caseStatusColors, [status]: color };
    setCaseStatusColorsState(newColors);
    localStorage.setItem('praxis-case-status-colors', JSON.stringify(newColors));
  };
  
  const setTaskStatusColor = (status: keyof StatusColorsType, color: string) => {
    const newColors = { ...taskStatusColors, [status]: color };
    setTaskStatusColorsState(newColors);
    localStorage.setItem('praxis-task-status-colors', JSON.stringify(newColors));
  };

  const setCaseStatusTextColor = (status: keyof StatusTextColorsType, color: string) => {
    const newColors = { ...caseStatusTextColors, [status]: color };
    setCaseStatusTextColorsState(newColors);
    localStorage.setItem('praxis-case-status-text-colors', JSON.stringify(newColors));
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
