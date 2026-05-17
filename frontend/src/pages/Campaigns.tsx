import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CampaignApi } from '@/api/endpoints'
import RoleGate from '@/components/RoleGate'
import Spinner from '@/components/Spinner'
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
          <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Kampagnen</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Bündeln Sie Ideen rund um ein Thema, eine Frist oder eine strategische Initiative.
          </p>
        </div>
        <RoleGate allow={['INNOVATION_MANAGER', 'ADMIN', 'SUPERADMIN']}>
          <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? <><X size={14} strokeWidth={2} /> Abbrechen</> : <><Plus size={14} strokeWidth={2} /> Neue Kampagne</>}
          </button>
        </RoleGate>
      </header>

      {showForm && (
        <section className="card p-4 space-y-3">
          <div className="eyebrow">Neue Kampagne</div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              className="input"
              placeholder="Name — z. B. Q4 Kundenbindung"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={120}
            />
            <label className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
              <span className="uppercase tracking-wider text-[11px] font-medium">Farbe</span>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-7 w-10 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
              />
            </label>
          </div>
          <textarea
            className="input min-h-[100px] leading-relaxed"
            placeholder="Worum geht es bei dieser Kampagne? Welche Ergebnisse streben Sie an?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={4000}
          />
          {error && <div className="text-[12px] text-rose-600 dark:text-rose-400">{error}</div>}
          <div className="flex items-center gap-2">
            <button
              className="btn-primary"
              onClick={() => createM.mutate()}
              disabled={!form.name.trim() || !form.description.trim() || createM.isPending}
            >
              {createM.isPending ? <><Spinner size={12} className="text-current" /> Wird angelegt…</> : 'Kampagne anlegen'}
            </button>
          </div>
        </section>
      )}

      {q.isLoading && <Spinner label="Wird geladen…" />}
      {q.data && q.data.length === 0 && (
        <div className="card p-8 text-center">
          <Megaphone className="mx-auto text-slate-400 dark:text-slate-500" size={28} strokeWidth={1.5} />
          <div className="mt-2 text-[14px] font-medium text-slate-900 dark:text-slate-100">Noch keine Kampagnen</div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Ein Innovationsmanager oder Administrator kann eine anlegen.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {q.data?.map((c) => {
          const now = Date.now()
          const ends = c.endsAt ? new Date(c.endsAt).getTime() : null
          const active = (!ends || ends > now)
          return (
            <Link
              key={c.id}
              to={`/campaigns/${c.id}`}
              className="card block p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{c.name}</h2>
                  <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{c.description}</p>
                </div>
                {!active && (
                  <span className="font-mono uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">beendet</span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                <span><span className="text-slate-900 dark:text-slate-100 font-medium">{c.ideaCount}</span> Ideen</span>
                <span>von {c.createdByName}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
