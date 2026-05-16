import { useQuery } from '@tanstack/react-query'
import { IdeaApi } from '@/api/endpoints'
import StageBadge, { stageLabels } from '@/components/StageBadge'
import type { Idea, Stage } from '@/types/api'
import { Link } from 'react-router-dom'

const COLUMNS: Stage[] = ['SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION', 'APPROVED', 'IN_IMPLEMENTATION', 'DONE']

export default function Workflow() {
  const q = useQuery({ queryKey: ['ideas'], queryFn: () => IdeaApi.list() })
  const ideas: Idea[] = q.data ?? []

  const byStage = (s: Stage) =>
    ideas
      .filter((i) => i.stage === s)
      .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Workflow board</h1>
        <p className="text-slate-500 mt-1">Kanban view of every active idea, sorted by priority score within each stage.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {COLUMNS.map((s) => (
          <div key={s} className="card p-4">
            <div className="flex items-center justify-between">
              <StageBadge stage={s} />
              <span className="text-xs text-slate-500">{byStage(s).length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {byStage(s).length === 0 && <div className="text-xs text-slate-400">No ideas in {stageLabels[s]}.</div>}
              {byStage(s).map((i) => (
                <Link key={i.id} to={`/ideas/${i.id}`} className="block border border-surface-border rounded-md px-3 py-2 hover:bg-slate-50">
                  <div className="text-sm font-medium text-slate-900 line-clamp-1">{i.title}</div>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-slate-500">
                    <span>{i.authorName}</span>
                    {i.priorityScore != null && <span className="badge-blue">{i.priorityScore.toFixed(2)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
