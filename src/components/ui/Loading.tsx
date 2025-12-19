import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Loading({ size = 'md', className }: LoadingProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loading size="lg" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded mb-2" />
      ))}
    </div>
  );
}
