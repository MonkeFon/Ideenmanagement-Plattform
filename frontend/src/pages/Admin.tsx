import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const ROLES = ['EMPLOYEE', 'REVIEWER', 'INNOVATION_MANAGER', 'SPONSOR', 'ADMIN'] as const

const ROLE_LABEL_DE: Record<string, string> = {
  EMPLOYEE: 'Mitarbeiter',
  REVIEWER: 'Prüfer',
  INNOVATION_MANAGER: 'Innovationsmanager',
  SPONSOR: 'Sponsor',
  ADMIN: 'Administrator',
  SUPERADMIN: 'Super-Administrator',
}

export default function Admin() {
  const qc = useQueryClient()
  const usersQ = useQuery({ queryKey: ['admin-users'], queryFn: () => AdminApi.listUsers() })
  const usageQ = useQuery({ queryKey: ['admin-usage'], queryFn: () => AdminApi.usage() })

  const [form, setForm] = useState({ email: '', displayName: '', password: 'demo1234', role: 'EMPLOYEE' })
  const [error, setError] = useState<string | null>(null)
  const [licenseHint, setLicenseHint] = useState<string | null>(null)

  const inviteM = useMutation({
    mutationFn: () => AdminApi.invite(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-usage'] })
      setForm({ email: '', displayName: '', password: 'demo1234', role: 'EMPLOYEE' })
    },
    onError: (err) => {
      const lic = asLicenseViolation(err)
      if (lic) setLicenseHint(`${lic.message} (${lic.reason})`)
      else setError((err as any)?.response?.data?.message ?? 'Einladung fehlgeschlagen')
    },
  })

  const usage = usageQ.data

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-6xl">
      <header>
        <div className="eyebrow">Verwaltung</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Admin</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Benutzer verwalten, Lizenznutzung einsehen und Limits prüfen.</p>
      </header>

      {usage && (
        <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded">
          <div className="p-4">
            <div className="eyebrow">Tarif</div>
            <div className="mt-1 text-lg font-semibold text-foreground tracking-tight">{usage.planName}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">€{usage.priceEur} / Platz / Monat</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {usage.features.length === 0 && <span className="text-[11px] text-muted-foreground/70">keine Zusatzfunktionen</span>}
              {usage.features.map((f) => (
                <Badge key={f} variant="outline" className="font-mono text-[10px] tracking-wider uppercase text-foreground/90">{f}</Badge>
              ))}
            </div>
          </div>

          <UsageMeter label="Plätze" used={usage.seatsUsed} limit={usage.seatLimit} />
          <UsageMeter label="Ideen diesen Monat" used={usage.ideasThisMonth} limit={usage.ideaLimit} />
        </section>
      )}

      <Card className="p-4">
        <div className="eyebrow">Benutzer einladen</div>
        {licenseHint && (
          <div className="mt-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900">
            {licenseHint} — für weitere Plätze ist ein höherer Tarif erforderlich.
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="E-Mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Anzeigename" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <Input placeholder="Passwort" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select
            className="flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL_DE[r] ?? r}</option>)}
          </select>
        </div>
        {error && <div className="mt-2 text-[12px] text-destructive">{error}</div>}
        <Button className="mt-3" onClick={() => inviteM.mutate()} disabled={!form.email || !form.displayName}>
          Einladen
        </Button>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-[13px]">
          <thead className="bg-muted text-muted-foreground uppercase text-[10px] tracking-wider">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Name</th>
              <th className="text-left px-4 py-2 font-semibold">E-Mail</th>
              <th className="text-left px-4 py-2 font-semibold">Rolle</th>
              <th className="text-left px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usersQ.data?.map((u) => (
              <tr key={u.id} className="hover:bg-accent/50">
                <td className="px-4 py-2 font-medium text-foreground">{u.displayName}</td>
                <td className="px-4 py-2 text-muted-foreground font-mono text-[12px]">{u.email}</td>
                <td className="px-4 py-2"><Badge variant="outline" className="text-[11px] text-foreground/90">{ROLE_LABEL_DE[u.role] ?? u.role}</Badge></td>
                <td className="px-4 py-2">{u.active
                  ? <Badge variant="green">aktiv</Badge>
                  : <Badge variant="red">deaktiviert</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const near = pct >= 80
  return (
    <div className="p-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground tabular-nums tracking-tight">
        {used}<span className="text-muted-foreground/70 font-normal">{limit != null ? ` / ${limit}` : ' / ∞'}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-accent overflow-hidden">
        <div
          className={cn('h-full', near ? 'bg-destructive' : 'bg-primary')}
          style={{ width: limit ? `${pct}%` : '8%' }}
        />
      </div>
    </div>
  )
}
