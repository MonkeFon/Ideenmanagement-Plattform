import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Visual stand-in for an IdeaCard during page-level loading.
 * Reserves the same vertical space (~120 px) so the layout doesn't thrash
 * when real cards arrive.
 */
export default function IdeaCardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex items-center gap-3 pt-1">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-20 ml-auto" />
      </div>
    </Card>
  )
}
