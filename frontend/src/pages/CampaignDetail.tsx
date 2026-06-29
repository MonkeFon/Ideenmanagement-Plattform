import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CampaignApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import { stageLabels } from '@/components/StageBadge'
import { PageSpinner } from '@/components/Spinner'
import RoleGate from '@/components/RoleGate'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { campaignStatus, STATUS_LABEL, fmtCampaignDate, type CampaignStatus } from '@/lib/campaign'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft, Trash2, ArrowBigUp, MessageSquare, Users, Lightbulb,
  CheckCircle2, CalendarRange, CalendarClock, CalendarCheck,
} from 'lucide-react'
import type { Idea, Stage } from '@/types/api'

const FUNNEL_STAGES: Stage[] = ['SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION', 'APPROVED', 'IN_IMPLEMENTATION', 'DONE']
const STAGE_COLOR: Record<string, string> = {
  SUBMITTED: '#64748b',
  UNDER_REVIEW: '#d97706',
  PRIORITIZATION: '#7c3aed',
  APPROVED: '#059669',
  IN_IMPLEMENTATION: '#0891b2',
  DONE: '#16a34a',
  REJECTED: '#e11d48',
}

type SortKey = 'votes' | 'newest' | 'priority' | 'comments'
const SORT_LABELS: Record<SortKey, string> = {
  votes: 'Meiste Stimmen',
  newest: 'Neueste zuerst',
  priority: 'Höchste Priorität',
  comments: 'Meiste Kommentare',
}

const SELECT_CLASS =
  'h-8 rounded border border-input bg-background px-2 text-[12px] text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export default function CampaignDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['campaign', id], queryFn: () => CampaignApi.get(id) })
  const [sort, setSort] = useState<SortKey>('votes')

  const deleteM = useMutation({
    mutationFn: () => CampaignApi.delete(id),
    onSuccess: () => {
      toast.success('Kampagne gelöscht', {
        description: 'Verknüpfte Ideen bleiben bestehen, ihre Kampagnen-Zuordnung wurde entfernt.',
      })
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      qc.invalidateQueries({ queryKey: ['ideas'] })
      navigate('/campaigns')
    },
  })

  const ideas = q.data?.ideas ?? []

  const stats = useMemo(() => {
    const votes = ideas.reduce((s, i) => s + i.netVotes, 0)
    const comments = ideas.reduce((s, i) => s + i.commentCount, 0)
    const contributors = new Set(ideas.map((i) => i.authorId)).size
    const done = ideas.filter((i) => i.stage === 'DONE').length
    const byStage = new Map<string, number>()
    for (const i of ideas) byStage.set(i.stage, (byStage.get(i.stage) ?? 0) + 1)
    return { votes, comments, contributors, done, byStage }
  }, [ideas])

  const sortedIdeas = useMemo(() => {
    const arr = [...ideas]
    arr.sort((a, b) => {
      switch (sort) {
        case 'votes':    return b.netVotes - a.netVotes
        case 'comments': return b.commentCount - a.commentCount
        case 'priority': return (b.priorityScore ?? -Infinity) - (a.priorityScore ?? -Infinity)
        case 'newest':   return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)
        default:         return 0
      }
    })
    return arr
  }, [ideas, sort])

  if (q.isLoading) return <PageSpinner />
  if (q.error || !q.data) return <div className="p-8 text-[13px] text-destructive">Kampagne nicht gefunden.</div>

  const { campaign: c } = q.data
  const status = campaignStatus(c.startsAt, c.endsAt)
  const completion = ideas.length > 0 ? Math.round((stats.done / ideas.length) * 100) : 0
  const funnelTotal = FUNNEL_STAGES.reduce((s, st) => s + (stats.byStage.get(st) ?? 0), 0)
  const rejected = stats.byStage.get('REJECTED') ?? 0

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <Link to="/campaigns" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
        <ArrowLeft size={12} strokeWidth={2} /> Alle Kampagnen
      </Link>

      <Card className="overflow-hidden">
        <div className="h-1.5" style={{ backgroundColor: c.color }} aria-hidden />
        <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <span className="mt-1.5 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="eyebrow">Kampagne</div>
                <StatusBadge status={status} />
              </div>
              <h1 className="mt-1 text-xl md:text-2xl font-semibold text-foreground tracking-tight break-words">
                {c.name}
              </h1>
              <p className="mt-2 text-[14px] text-foreground/90 leading-relaxed max-w-3xl whitespace-pre-wrap">{c.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span>angelegt von <span className="text-foreground">{c.createdByName}</span></span>
                <span className="font-mono tabular-nums">{fmtCampaignDate(c.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild><Link to={`/submit?campaign=${c.id}`}>Idee einreichen</Link></Button>
            <RoleGate allow={['IDEA_MANAGER', 'ADMIN', 'SUPERADMIN']}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Kampagne löschen" title="Kampagne löschen">
                    <Trash2 size={15} strokeWidth={1.75} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Kampagne „{c.name}" löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Die <span className="font-medium text-foreground">{ideas.length}</span>{' '}
                      {ideas.length === 1 ? 'verknüpfte Idee bleibt bestehen' : 'verknüpften Ideen bleiben bestehen'}
                      , ihre Zuordnung zur Kampagne wird aber entfernt. Dieser Vorgang lässt sich nicht rückgängig machen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => { e.preventDefault(); deleteM.mutate() }}
                      disabled={deleteM.isPending}
                    >
                      {deleteM.isPending ? 'Wird gelöscht…' : 'Löschen'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </RoleGate>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border border border-border rounded">
        <Kpi icon={<Lightbulb size={15} strokeWidth={1.75} />} label="Ideen" value={ideas.length} />
        <Kpi icon={<ArrowBigUp size={15} strokeWidth={1.75} />} label="Stimmen" value={stats.votes} />
        <Kpi icon={<MessageSquare size={14} strokeWidth={1.75} />} label="Kommentare" value={stats.comments} />
        <Kpi icon={<Users size={14} strokeWidth={1.75} />} label="Beteiligte" value={stats.contributors} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 md:p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="eyebrow">Pipeline</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 size={13} strokeWidth={1.75} className="text-green-600 dark:text-green-500" />
              <span className="tabular-nums">{completion}% erledigt</span>
            </div>
          </div>

          {funnelTotal === 0 ? (
            <p className="text-[13px] text-muted-foreground">Noch keine Ideen im Workflow.</p>
          ) : (
            <>

              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                {FUNNEL_STAGES.map((st) => {
                  const n = stats.byStage.get(st) ?? 0
                  if (n === 0) return null
                  return (
                    <div
                      key={st}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${(n / funnelTotal) * 100}%`, backgroundColor: STAGE_COLOR[st] }}
                      title={`${stageLabels[st]}: ${n}`}
                    />
                  )
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {FUNNEL_STAGES.map((st) => {
                  const n = stats.byStage.get(st) ?? 0
                  return (
                    <div key={st} className={cn('flex items-center gap-2 text-[12px]', n === 0 && 'opacity-40')}>
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: STAGE_COLOR[st] }} />
                      <span className="text-muted-foreground truncate">{stageLabels[st]}</span>
                      <span className="ml-auto font-medium text-foreground tabular-nums">{n}</span>
                    </div>
                  )
                })}
              </div>

              {rejected > 0 && (
                <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
                  <span className="inline-block h-2 w-2 rounded-full align-middle mr-1.5" style={{ backgroundColor: STAGE_COLOR.REJECTED }} />
                  {rejected} {rejected === 1 ? 'Idee abgelehnt' : 'Ideen abgelehnt'} (nicht im Trichter gezählt)
                </p>
              )}
            </>
          )}
        </Card>

        <Card className="p-4 md:p-5 space-y-4">
          <div className="eyebrow flex items-center gap-2">
            <CalendarRange size={12} strokeWidth={2} className="text-muted-foreground" />
            Zeitraum
          </div>
          <TimeWindow startsAt={c.startsAt} endsAt={c.endsAt} status={status} />
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="eyebrow">Ideen in dieser Kampagne</div>
          {ideas.length > 1 && (
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="uppercase tracking-wider text-[11px] font-medium">Sortieren</span>
              <select className={SELECT_CLASS} value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Ideen sortieren">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>{SORT_LABELS[k]}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {ideas.length === 0 ? (
          <Card className="p-8 text-center">
            <Lightbulb className="mx-auto text-muted-foreground/50" size={24} strokeWidth={1.5} />
            <div className="mt-2 text-[13px] font-medium text-foreground">Noch keine Ideen verknüpft</div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Seien Sie die erste Person, die zu dieser Kampagne beiträgt.
            </p>
            <Button asChild size="sm" className="mt-3"><Link to={`/submit?campaign=${c.id}`}>Idee einreichen</Link></Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedIdeas.map((i: Idea) => <IdeaCard key={i.id} idea={i} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function Kpi({ icon, label, value }: { icon: JSX.Element; label: string; value: number }) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold text-foreground tabular-nums tracking-tight">{value}</div>
    </div>
  )
}

type Status = CampaignStatus

function StatusBadge({ status }: { status: Status }) {
  const variant = status === 'active' ? 'green' : status === 'planned' ? 'amber' : 'gray'
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>
}

function TimeWindow({ startsAt, endsAt, status }: { startsAt: string | null; endsAt: string | null; status: Status }) {
  if (!startsAt && !endsAt) {
    return <p className="text-[13px] text-muted-foreground">Kein fester Zeitraum — diese Kampagne läuft offen.</p>
  }

  const now = Date.now()
  const start = startsAt ? Date.parse(startsAt) : null
  const end = endsAt ? Date.parse(endsAt) : null

  let pct: number | null = null
  if (start && end && end > start) {
    pct = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)))
  }

  const daysLeft = end ? Math.ceil((end - now) / 86_400_000) : null

  return (
    <div className="space-y-3">
      <dl className="space-y-2 text-[13px]">
        {start && (
          <div className="flex items-center gap-2">
            <CalendarClock size={13} strokeWidth={1.75} className="text-muted-foreground shrink-0" />
            <dt className="text-muted-foreground w-12">Start</dt>
            <dd className="text-foreground font-medium tabular-nums">{fmtCampaignDate(startsAt!)}</dd>
          </div>
        )}
        {end && (
          <div className="flex items-center gap-2">
            <CalendarCheck size={13} strokeWidth={1.75} className="text-muted-foreground shrink-0" />
            <dt className="text-muted-foreground w-12">Ende</dt>
            <dd className="text-foreground font-medium tabular-nums">{fmtCampaignDate(endsAt!)}</dd>
          </div>
        )}
      </dl>

      {pct !== null && (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground/70" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>{pct}% vergangen</span>
            {status === 'active' && daysLeft !== null && daysLeft >= 0 && (
              <span className="text-foreground font-medium">noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'}</span>
            )}
          </div>
        </div>
      )}

      {pct === null && status === 'active' && daysLeft !== null && daysLeft >= 0 && (
        <p className="text-[12px] text-foreground"><span className="font-medium">noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'}</span> bis zum Ende</p>
      )}
      {status === 'ended' && <p className="text-[12px] text-muted-foreground">Diese Kampagne ist abgeschlossen.</p>}
      {status === 'planned' && start && (
        <p className="text-[12px] text-muted-foreground">
          Startet in {Math.max(0, Math.ceil((start - now) / 86_400_000))} Tagen.
        </p>
      )}
    </div>
  )
}
