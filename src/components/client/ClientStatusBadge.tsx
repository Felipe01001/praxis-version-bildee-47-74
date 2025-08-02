
import React from 'react';
import { ClientStatus } from '@/types';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface ClientStatusBadgeProps {
  status: ClientStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ClientStatusBadge = ({ status, showIcon = true, size = 'md' }: ClientStatusBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs py-0 px-1.5',
    md: 'text-xs py-0.5 px-2',
    lg: 'text-sm py-1 px-2.5'
  };
  
  return (
    <Badge 
      className={`${CLIENT_STATUS_COLORS[status]} ${sizeClasses[size]} flex items-center gap-1`}
    >
      {showIcon && (
        status === 'active' 
          ? <Check className="h-3 w-3" /> 
          : <X className="h-3 w-3" />
      )}
      {CLIENT_STATUS_LABELS[status]}
    </Badge>
  );
};
