import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} aria-label="Lädt" />;
}

export function PageLoading() {
  return (
    <div className="flex h-64 items-center justify-center" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="sr-only">Lädt …</span>
    </div>
  );
}

