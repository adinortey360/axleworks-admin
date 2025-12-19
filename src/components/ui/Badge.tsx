import React from 'react';
import { cn, getStatusColor } from '../../utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  status?: string;
  className?: string;
}

const variants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function Badge({ children, variant = 'default', status, className }: BadgeProps) {
  const colorClass = status ? getStatusColor(status) : variants[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}
