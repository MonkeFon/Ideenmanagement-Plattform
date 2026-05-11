import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatAbsolute, formatRelative } from '@/lib/format';

export function DateText({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">–</span>;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline-offset-2 hover:underline">
            {formatRelative(value)}
          </span>
        </TooltipTrigger>
        <TooltipContent>{formatAbsolute(value)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

