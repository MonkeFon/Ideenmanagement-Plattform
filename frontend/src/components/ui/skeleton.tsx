import { cn } from '@/lib/utils'

/**
 * Pulsing placeholder block used while a page-level query is loading.
 * Single primitive — pages compose their own skeleton shapes from it.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded bg-muted', className)} {...props} />
}
