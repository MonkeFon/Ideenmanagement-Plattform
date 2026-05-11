import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'Nichts zu sehen',
  description,
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <div className="mb-3 text-muted-foreground">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

