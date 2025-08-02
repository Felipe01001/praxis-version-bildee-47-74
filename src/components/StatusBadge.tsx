
import React from 'react';
import { Status } from '@/types';
import { STATUS_LABELS } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: Status;
  useCustomization?: boolean;
  className?: string;
}

export const StatusBadge = ({ status, useCustomization = false, className }: StatusBadgeProps) => {
  const { caseStatusColors, taskStatusColors, caseStatusTextColors, currentStatusView } = useTheme();
  
  if (useCustomization) {
    const bgColor = currentStatusView === 'cases' 
      ? caseStatusColors[status] 
      : taskStatusColors[status];
      
    const textColor = currentStatusView === 'cases'
      ? caseStatusTextColors[status]
      : '#1A1F2C'; // Default dark text for tasks
      
    return (
      <Badge 
        className={className}
        style={{ 
          backgroundColor: bgColor,
          color: textColor
        }}
      >
        {STATUS_LABELS[status]}
      </Badge>
    );
  }
  
  // Default style from constants with a more intense red for 'delayed'
  return (
    <Badge className={cn(
      `bg-${status === 'completed' ? 'green' : status === 'in-progress' ? 'blue' : status === 'delayed' ? 'red' : 'amber'}-${status === 'delayed' ? '200' : '100'} text-${status === 'completed' ? 'green' : status === 'in-progress' ? 'blue' : status === 'delayed' ? 'red' : 'amber'}-${status === 'delayed' ? '900' : '800'}`,
      className
    )}>
      {STATUS_LABELS[status]}
    </Badge>
  );
};
