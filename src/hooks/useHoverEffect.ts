
import { useTheme } from '@/context/ThemeContext';

export const useHoverEffect = () => {
  const { headerColor } = useTheme();
  
  const getHoverStyle = (opacity: number = 0.5) => ({
    backgroundColor: `${headerColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
  });
  
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, opacity: number = 0.5) => {
    const style = getHoverStyle(opacity);
    Object.assign(e.currentTarget.style, style);
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = '';
  };
  
  return {
    getHoverStyle,
    handleMouseEnter,
    handleMouseLeave,
  };
};
