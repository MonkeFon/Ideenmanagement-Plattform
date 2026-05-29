import { Link } from 'react-router-dom'
import type { Idea } from '@/types/api'
import StageBadge from './StageBadge'
import { Card } from '@/components/ui/card'
import { ArrowUp, MessageSquare, Star } from 'lucide-react'

export default function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Card asChild className="block p-4 transition-colors hover:border-input">
      <Link to={`/ideas/${idea.id}`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-foreground text-[14px] leading-snug tracking-tight">{idea.title}</h3>
          <StageBadge stage={idea.stage} />
        </div>
        <p className="mt-1.5 text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">{idea.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground tabular-nums">
          <span className="inline-flex items-center gap-1">
            <ArrowUp size={12} strokeWidth={2} className={idea.netVotes > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''} />
            {idea.netVotes > 0 ? '+' : ''}{idea.netVotes}
          </span>
          <span className="inline-flex items-center gap-1"><MessageSquare size={12} strokeWidth={2} /> {idea.commentCount}</span>
          {idea.evaluationCount > 0 && (
            <span className="inline-flex items-center gap-1"><Star size={12} strokeWidth={2} /> {idea.evaluationCount}</span>
          )}
          {idea.sponsorBoost && (
            <span className="text-foreground font-medium uppercase tracking-wider text-[10px]">gefördert</span>
          )}
          {idea.category && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 border border-input rounded px-1">{idea.category}</span>
          )}
          {idea.priorityScore != null && (
            <span className="font-mono text-foreground">{idea.priorityScore.toFixed(2)}</span>
          )}
          {idea.campaignName && (
            <span className="inline-flex items-center gap-1 text-[11px] text-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: idea.campaignColor ?? '#6366f1' }} aria-hidden />
              {idea.campaignName}
            </span>
          )}
          <span className="text-muted-foreground/70 truncate">{idea.authorName}</span>
        </div>
      </Link>
    </Card>
  )
}
