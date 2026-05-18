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
import { Megaphone, Plus, X } from 'lucide-react'

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

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Initiativen</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Kampagnen</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Bündeln Sie Ideen rund um ein Thema, eine Frist oder eine strategische Initiative.
          </p>
        </div>
        <RoleGate allow={['INNOVATION_MANAGER', 'ADMIN', 'SUPERADMIN']}>
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? <><X size={14} strokeWidth={2} /> Abbrechen</> : <><Plus size={14} strokeWidth={2} /> Neue Kampagne</>}
          </Button>
        </RoleGate>
      </header>

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

      {q.isLoading && <Spinner label="Wird geladen…" />}
      {q.data && q.data.length === 0 && (
        <Card className="p-8 text-center">
          <Megaphone className="mx-auto text-muted-foreground/70" size={28} strokeWidth={1.5} />
          <div className="mt-2 text-[14px] font-medium text-foreground">Noch keine Kampagnen</div>
          <p className="text-[12px] text-muted-foreground mt-1">Ein Innovationsmanager oder Administrator kann eine anlegen.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {q.data?.map((c) => {
          const now = Date.now()
          const ends = c.endsAt ? new Date(c.endsAt).getTime() : null
          const active = (!ends || ends > now)
          return (
            <Card key={c.id} asChild className="p-4 transition-colors hover:border-input">
              <Link to={`/campaigns/${c.id}`}>
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[14px] font-semibold text-foreground tracking-tight">{c.name}</h2>
                    <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>
                  {!active && (
                    <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground/70">beendet</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span><span className="text-foreground font-medium">{c.ideaCount}</span> Ideen</span>
                  <span>von {c.createdByName}</span>
                </div>
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
