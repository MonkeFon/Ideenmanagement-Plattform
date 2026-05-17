import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CampaignApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import { PageSpinner } from '@/components/Spinner'
import { ArrowLeft } from 'lucide-react'

export default function CampaignDetail() {
  const { id = '' } = useParams()
  const q = useQuery({ queryKey: ['campaign', id], queryFn: () => CampaignApi.get(id) })

  if (q.isLoading) return <PageSpinner />
  if (q.error || !q.data) return <div className="p-8 text-[13px] text-rose-600 dark:text-rose-400">Kampagne nicht gefunden.</div>

  const { campaign: c, ideas } = q.data
  const window = formatWindow(c.startsAt, c.endsAt)

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-6">
      <Link to="/campaigns" className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
        <ArrowLeft size={12} strokeWidth={2} /> Alle Kampagnen
      </Link>

      <header className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <span className="mt-1.5 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="eyebrow">Kampagne</div>
            <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight break-words">
              {c.name}
            </h1>
            <p className="mt-2 text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl whitespace-pre-wrap">{c.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span><span className="text-slate-900 dark:text-slate-100 font-medium tabular-nums">{ideas.length}</span> Ideen</span>
              {window && <span className="font-mono tabular-nums">{window}</span>}
              <span>angelegt von {c.createdByName}</span>
            </div>
          </div>
        </div>
        <Link to={`/submit?campaign=${c.id}`} className="btn-primary shrink-0">Für diese Kampagne einreichen</Link>
      </header>

      <section>
        <div className="eyebrow mb-3">Ideen in dieser Kampagne</div>
        {ideas.length === 0 && (
          <div className="card p-6 text-[13px] text-slate-500 dark:text-slate-400 text-center">
            Noch keine Ideen mit dieser Kampagne verknüpft. <Link to="/submit" className="text-slate-900 dark:text-slate-100 underline underline-offset-2 ml-1">Eine einreichen</Link>.
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {ideas.map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>
    </div>
  )
}

function formatWindow(starts: string | null, ends: string | null): string | null {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  if (!starts && !ends) return null
  if (starts && ends) return `${fmt(starts)} → ${fmt(ends)}`
  if (starts) return `seit ${fmt(starts)}`
  return `bis ${fmt(ends!)}`
}
