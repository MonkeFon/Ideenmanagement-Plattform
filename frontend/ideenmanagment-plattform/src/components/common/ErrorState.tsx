import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({
  title = 'Ein Fehler ist aufgetreten',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center"
    >
      <AlertTriangle className="mb-2 h-8 w-8 text-destructive" />
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
          Erneut versuchen
        </Button>
      )}
    </div>
  );
}

