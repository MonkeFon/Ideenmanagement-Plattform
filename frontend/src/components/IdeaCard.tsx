import { Link } from 'react-router-dom'
import type { Idea } from '@/types/api'
import StageBadge from './StageBadge'
import { ArrowUp, MessageSquare, Star } from 'lucide-react'

export default function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link
      to={`/ideas/${idea.id}`}
      className="card block p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-slate-900 dark:text-slate-100 text-[14px] leading-snug tracking-tight">{idea.title}</h3>
        <StageBadge stage={idea.stage} />
      </div>
      <p className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{idea.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
        <span className="inline-flex items-center gap-1">
          <ArrowUp size={12} strokeWidth={2} className={idea.netVotes > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''} />
          {idea.netVotes > 0 ? '+' : ''}{idea.netVotes}
        </span>
        <span className="inline-flex items-center gap-1"><MessageSquare size={12} strokeWidth={2} /> {idea.commentCount}</span>
        {idea.evaluationCount > 0 && (
          <span className="inline-flex items-center gap-1"><Star size={12} strokeWidth={2} /> {idea.evaluationCount}</span>
        )}
        {idea.sponsorBoost && (
          <span className="text-slate-900 dark:text-slate-100 font-medium uppercase tracking-wider text-[10px]">gefördert</span>
        )}
        {idea.category && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1">{idea.category}</span>
        )}
        {idea.priorityScore != null && (
          <span className="font-mono text-slate-900 dark:text-slate-100">{idea.priorityScore.toFixed(2)}</span>
        )}
        {idea.campaignName && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: idea.campaignColor ?? '#6366f1' }} aria-hidden />
            {idea.campaignName}
          </span>
        )}
        <span className="text-slate-400 dark:text-slate-500 truncate">{idea.authorName}</span>
      </div>
    </Link>
  )
}
