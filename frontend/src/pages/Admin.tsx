import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'

const ROLES = ['EMPLOYEE', 'REVIEWER', 'INNOVATION_MANAGER', 'SPONSOR', 'ADMIN'] as const

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
      else setError((err as any)?.response?.data?.message ?? 'Invite failed')
    },
  })

  const usage = usageQ.data

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-6xl">
      <header>
        <div className="eyebrow">Verwaltung</div>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Admin</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Benutzer verwalten, Lizenznutzung einsehen und Limits prüfen.</p>
      </header>

      {usage && (
        <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded">
          <div className="p-4">
            <div className="eyebrow">Tarif</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{usage.planName}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">€{usage.priceEur} / Platz / Monat</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {usage.features.length === 0 && <span className="text-[11px] text-slate-400 dark:text-slate-500">keine Extras</span>}
              {usage.features.map((f) => (
                <span key={f} className="font-mono text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">{f}</span>
              ))}
            </div>
          </div>

          <UsageMeter label="Plätze" used={usage.seatsUsed} limit={usage.seatLimit} />
          <UsageMeter label="Ideen diesen Monat" used={usage.ideasThisMonth} limit={usage.ideaLimit} />
        </section>
      )}

      <section className="card p-4">
        <div className="eyebrow">Benutzer einladen</div>
        {licenseHint && (
          <div className="mt-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900">
            {licenseHint} — Upgrade Ihres Tarifs nötig, um weitere Plätze hinzuzufügen.
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="input" placeholder="E-Mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Anzeigename" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <input className="input" placeholder="Passwort" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {error && <div className="mt-2 text-[12px] text-rose-600 dark:text-rose-400">{error}</div>}
        <button className="btn-primary mt-3" onClick={() => inviteM.mutate()} disabled={!form.email || !form.displayName}>
          Einladen
        </button>
      </section>

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[36rem] text-[13px]">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">Name</th>
              <th className="text-left px-4 py-2 font-semibold">E-Mail</th>
              <th className="text-left px-4 py-2 font-semibold">Rolle</th>
              <th className="text-left px-4 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {usersQ.data?.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{u.displayName}</td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-400 font-mono text-[12px]">{u.email}</td>
                <td className="px-4 py-2"><span className="font-mono text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">{u.role}</span></td>
                <td className="px-4 py-2">{u.active
                  ? <span className="badge-green">aktiv</span>
                  : <span className="badge-red">deaktiviert</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const near = pct >= 80
  return (
    <div className="p-4">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
        {used}<span className="text-slate-400 dark:text-slate-500 font-normal">{limit != null ? ` / ${limit}` : ' / ∞'}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${near ? 'bg-rose-500' : 'bg-slate-900 dark:bg-slate-100'}`}
          style={{ width: limit ? `${pct}%` : '8%' }}
        />
      </div>
    </div>
  )
}
