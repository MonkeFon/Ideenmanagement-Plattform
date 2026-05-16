import { useQuery } from '@tanstack/react-query'
import { IdeaApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import { useAuth } from '@/store/auth'
import { Lightbulb, ArrowUp, TrendingUp, CheckCircle2 } from 'lucide-react'
import type { Idea, Stage } from '@/types/api'

export default function Dashboard() {
  const user = useAuth((s) => s.user)!
  const ideasQ = useQuery({ queryKey: ['ideas'], queryFn: () => IdeaApi.list() })
  const ideas: Idea[] = ideasQ.data ?? []

  const byStage = (...s: Stage[]) => ideas.filter((i) => s.includes(i.stage))
  const open = byStage('SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION')
  const inFlight = byStage('APPROVED', 'IN_IMPLEMENTATION')
  const done = byStage('DONE')

  const trending = [...open].sort((a, b) => b.netVotes - a.netVotes).slice(0, 3)

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user.displayName.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1">Here's what's happening across {user.tenantName}.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat icon={<Lightbulb size={20} />} label="Open ideas" value={open.length} accent="bg-brand-50 text-brand-700" />
        <Stat icon={<TrendingUp size={20} />} label="In implementation" value={inFlight.length} accent="bg-amber-50 text-amber-700" />
        <Stat icon={<CheckCircle2 size={20} />} label="Shipped" value={done.length} accent="bg-emerald-50 text-emerald-700" />
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Trending this week
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {trending.length === 0 && <div className="text-sm text-slate-500">Nothing in flight yet — be the first to submit.</div>}
          {trending.map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Recent activity
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ideas.slice(0, 6).map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, label, value, accent }: { icon: JSX.Element; label: string; value: number; accent: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-md flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  )
}
