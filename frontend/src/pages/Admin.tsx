import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'
import { Users, Crown } from 'lucide-react'

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
    <div className="p-8 space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
        <p className="text-slate-500 mt-1">Manage users, see plan usage, and verify license limits.</p>
      </header>

      {usage && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-slate-500"><Crown size={16} /> Plan</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{usage.planName}</div>
            <div className="text-xs text-slate-500 mt-1">€{usage.priceEur} / seat / month</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {usage.features.length === 0 && <span className="badge-gray">no extras</span>}
              {usage.features.map((f) => <span key={f} className="badge-blue">{f}</span>)}
            </div>
          </div>

          <UsageMeter label="Seats" used={usage.seatsUsed} limit={usage.seatLimit} />
          <UsageMeter label="Ideas this month" used={usage.ideasThisMonth} limit={usage.ideaLimit} />
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Users size={16} /> Invite a user</h2>
        {licenseHint && (
          <div className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-3">
            {licenseHint} — upgrade your plan to add more seats.
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <input className="input" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}
        <button className="btn-primary mt-3" onClick={() => inviteM.mutate()} disabled={!form.email || !form.displayName}>
          Invite
        </button>
      </section>

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle text-slate-500 uppercase text-xs">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Name</th>
              <th className="text-left px-5 py-3 font-semibold">Email</th>
              <th className="text-left px-5 py-3 font-semibold">Role</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {usersQ.data?.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 font-medium text-slate-900">{u.displayName}</td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3"><span className="badge-gray">{u.role}</span></td>
                <td className="px-5 py-3">{u.active
                  ? <span className="badge-green">active</span>
                  : <span className="badge-red">disabled</span>}</td>
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
    <div className="card p-5">
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">
        {used}{limit != null ? ` / ${limit}` : ' / ∞'}
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${near ? 'bg-rose-500' : 'bg-brand-500'}`}
          style={{ width: limit ? `${pct}%` : '8%' }}
        />
      </div>
    </div>
  )
}
