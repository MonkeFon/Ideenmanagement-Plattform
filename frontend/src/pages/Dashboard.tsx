import { useQuery } from '@tanstack/react-query'
import { IdeaApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import { useAuth } from '@/store/auth'
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
        <div className="eyebrow">Übersicht</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">
          Willkommen zurück, {user.displayName.split(' ')[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Aktivität bei {user.tenantName}.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border border-border rounded">
        <Stat label="Offen" value={open.length} />
        <Stat label="In Umsetzung" value={inFlight.length} />
        <Stat label="Erledigt" value={done.length} />
      </div>

      <section>
        <div className="eyebrow mb-3">Diese Woche im Trend</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {trending.length === 0 && <div className="text-sm text-muted-foreground">Noch nichts unterwegs — reichen Sie die erste Idee ein.</div>}
          {trending.map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>

      <section>
        <div className="eyebrow mb-3">Letzte Aktivität</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ideas.slice(0, 6).map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground tabular-nums tracking-tight">{value}</div>
    </div>
  )
}
