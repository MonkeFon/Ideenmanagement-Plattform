import { Badge } from '@/components/ui/badge';
import { IDEA_STATUS_COLOR, IDEA_STATUS_LABEL } from '@/lib/format';
import type { IdeaStatus } from '@/types/api';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', IDEA_STATUS_COLOR[status])}>
      {IDEA_STATUS_LABEL[status]}
    </Badge>
  );
}

