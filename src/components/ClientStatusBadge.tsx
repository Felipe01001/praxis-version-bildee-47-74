
import React from 'react';
import { ClientStatus } from '@/types';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS } from '@/constants';
import { Badge } from '@/components/ui/badge';

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export const ClientStatusBadge = ({ status }: ClientStatusBadgeProps) => {
  return (
    <Badge className={CLIENT_STATUS_COLORS[status]}>
      {CLIENT_STATUS_LABELS[status]}
    </Badge>
  );
};
