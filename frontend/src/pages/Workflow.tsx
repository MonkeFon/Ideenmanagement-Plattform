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
    <div className="p-4 md:p-8 space-y-5">
      <header>
        <div className="eyebrow">Workflow</div>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Board</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Alle aktiven Ideen, gruppiert nach Status und sortiert nach Prioritäts-Score.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {COLUMNS.map((s) => (
          <div key={s} className="card p-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <StageBadge stage={s} />
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{byStage(s).length}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {byStage(s).length === 0 && <div className="text-[11px] text-slate-400 dark:text-slate-500 py-1">Keine Ideen.</div>}
              {byStage(s).map((i) => (
                <Link key={i.id} to={`/ideas/${i.id}`} className="block border border-slate-200 dark:border-slate-800 rounded px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 line-clamp-1 tracking-tight">{i.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate pr-2">{i.authorName}</span>
                    {i.priorityScore != null && <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">{i.priorityScore.toFixed(2)}</span>}
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
