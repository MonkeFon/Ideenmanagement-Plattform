import { Link } from 'react-router-dom'
import type { Idea } from '@/types/api'
import StageBadge from './StageBadge'
import { ArrowUp, MessageSquare, Sparkles, Star } from 'lucide-react'

export default function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link to={`/ideas/${idea.id}`} className="card block p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-base leading-snug">{idea.title}</h3>
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{idea.description}</p>
        </div>
        <StageBadge stage={idea.stage} />
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><ArrowUp size={14} /> {idea.netVotes}</span>
        <span className="flex items-center gap-1"><MessageSquare size={14} /> {idea.commentCount}</span>
        {idea.evaluationCount > 0 && (
          <span className="flex items-center gap-1"><Star size={14} /> {idea.evaluationCount} review{idea.evaluationCount === 1 ? '' : 's'}</span>
        )}
        {idea.sponsorBoost && (
          <span className="flex items-center gap-1 text-brand-700">
            <Sparkles size={14} /> Sponsor boost
          </span>
        )}
        {idea.category && (
          <span className="ml-auto badge-gray">{idea.category}</span>
        )}
        {idea.priorityScore != null && (
          <span className="badge-blue">Priority {idea.priorityScore.toFixed(2)}</span>
        )}
        <span className="text-slate-400">· by {idea.authorName}</span>
      </div>
    </Link>
  )
}
