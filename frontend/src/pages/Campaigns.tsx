import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CampaignApi } from '@/api/endpoints'
import RoleGate from '@/components/RoleGate'
import Spinner from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  campaignStatus, STATUS_LABEL, fmtCampaignDate, campaignProgress, daysUntilEnd,
  type CampaignStatus,
} from '@/lib/campaign'
import { Megaphone, Plus, X, Lightbulb, CalendarRange, Infinity as InfinityIcon } from 'lucide-react'
import type { Campaign } from '@/types/api'

export default function Campaigns() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['campaigns'], queryFn: () => CampaignApi.list() })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })
  const [error, setError] = useState<string | null>(null)

  const createM = useMutation({
    mutationFn: () => CampaignApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      setShowForm(false)
      setForm({ name: '', description: '', color: '#6366f1' })
      setError(null)
    },
    onError: (err) => setError((err as any)?.response?.data?.message ?? 'Kampagne konnte nicht angelegt werden'),
  })

  const campaigns = q.data ?? []
  const totalIdeas = campaigns.reduce((s, c) => s + c.ideaCount, 0)
  const activeCount = campaigns.filter((c) => campaignStatus(c.startsAt, c.endsAt) === 'active').length

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Initiativen</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Kampagnen</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Erstellung einer übergeordneten Kampagne.
          </p>
        </div>
        <RoleGate allow={['IDEA_MANAGER', 'ADMIN', 'SUPERADMIN']}>
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <><X size={14} strokeWidth={2} /> Abbrechen</> : <><Plus size={14} strokeWidth={2} /> Neue Kampagne</>}
          </Button>
        </RoleGate>
      </header>

      {!q.isLoading && campaigns.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-muted-foreground">
          <span><span className="text-foreground font-semibold tabular-nums">{campaigns.length}</span> Kampagnen</span>
          <span><span className="text-foreground font-semibold tabular-nums">{activeCount}</span> aktiv</span>
          <span><span className="text-foreground font-semibold tabular-nums">{totalIdeas}</span> Ideen insgesamt</span>
        </div>
      )}

      {showForm && (
        <Card className="p-4 space-y-3">
          <div className="eyebrow">Neue Kampagne</div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <Input
              placeholder="Name — z. B. Q4 Kundenbindung"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={120}
            />
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="uppercase tracking-wider text-[11px] font-medium">Farbe</span>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-7 w-10 rounded border border-input bg-transparent cursor-pointer"
              />
            </label>
          </div>
          <Textarea
            className="min-h-[100px] leading-relaxed"
            placeholder="Worum geht es bei dieser Kampagne? Welche Ergebnisse streben Sie an?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={4000}
          />
          {error && <div className="text-[12px] text-destructive">{error}</div>}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => createM.mutate()}
              disabled={!form.name.trim() || !form.description.trim() || createM.isPending}
            >
              {createM.isPending ? <><Spinner size={12} className="text-current" /> Wird angelegt…</> : 'Kampagne anlegen'}
            </Button>
          </div>
        </Card>
      )}

      {q.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="p-0 overflow-hidden">
              <Skeleton className="h-1.5 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-2 w-full mt-4" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {q.data && campaigns.length === 0 && (
        <Card className="p-8 text-center">
          <Megaphone className="mx-auto text-muted-foreground/70" size={28} strokeWidth={1.5} />
          <div className="mt-2 text-[14px] font-medium text-foreground">Noch keine Kampagnen</div>
          <p className="text-[12px] text-muted-foreground mt-1">Ein Ideenmanager oder Administrator kann eine anlegen.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {campaigns.map((c) => <CampaignPreviewCard key={c.id} c={c} />)}
      </div>
    </div>
  )
}

function CampaignPreviewCard({ c }: { c: Campaign }) {
  const status = campaignStatus(c.startsAt, c.endsAt)
  const pct = campaignProgress(c.startsAt, c.endsAt)
  const daysLeft = daysUntilEnd(c.endsAt)

  return (
    <Card asChild className="p-0 overflow-hidden transition-colors hover:border-input">
      <Link to={`/campaigns/${c.id}`} className="block">

        <div className="h-1.5" style={{ backgroundColor: c.color }} aria-hidden />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="mt-1 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} aria-hidden />
              <h2 className="text-[14px] font-semibold text-foreground tracking-tight leading-snug min-w-0">{c.name}</h2>
            </div>
            <StatusBadge status={status} />
          </div>

          <p className="mt-2 text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">{c.description}</p>

          <div className="mt-3.5">
            {pct !== null ? (
              <>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: status === 'ended' ? '#94a3b8' : c.color }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span>{fmtCampaignDate(c.startsAt!)} – {fmtCampaignDate(c.endsAt!)}</span>
                  {status === 'active' && daysLeft !== null && daysLeft >= 0 && (
                    <span className="text-foreground font-medium">noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'}</span>
                  )}
                  {status === 'ended' && <span>beendet</span>}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {c.startsAt || c.endsAt
                  ? <><CalendarRange size={12} strokeWidth={1.75} />{timelinePartial(c)}</>
                  : <><InfinityIcon size={12} strokeWidth={1.75} /> Läuft offen — kein festes Enddatum</>}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Lightbulb size={13} strokeWidth={1.75} className="text-muted-foreground" />
              <span className="font-semibold tabular-nums">{c.ideaCount}</span>
              <span className="font-normal text-muted-foreground">{c.ideaCount === 1 ? 'Idee' : 'Ideen'}</span>
            </span>
            <span className="truncate max-w-[10rem]">von {c.createdByName}</span>
          </div>
        </div>
      </Link>
    </Card>
  )
}

function timelinePartial(c: Campaign): string {
  if (c.startsAt && !c.endsAt) return `seit ${fmtCampaignDate(c.startsAt)}`
  if (!c.startsAt && c.endsAt) return `bis ${fmtCampaignDate(c.endsAt)}`
  return ''
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const variant = status === 'active' ? 'green' : status === 'planned' ? 'amber' : 'gray'
  return <Badge variant={variant} className="shrink-0">{STATUS_LABEL[status]}</Badge>
}
