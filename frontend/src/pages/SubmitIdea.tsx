import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CampaignApi, IdeaApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'
import Spinner from '@/components/Spinner'

export default function SubmitIdea() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [campaignId, setCampaignId] = useState<string>(searchParams.get('campaign') ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [licenseHint, setLicenseHint] = useState<string | null>(null)

  const campaignsQ = useQuery({ queryKey: ['campaigns'], queryFn: () => CampaignApi.list() })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setLicenseHint(null)
    try {
      const idea = await IdeaApi.create({
        title,
        description,
        category: category || undefined,
        campaignId: campaignId || undefined,
      })
      // Auto-submit out of DRAFT
      await IdeaApi.transition(idea.id, 'SUBMITTED', 'Initial submission')
      navigate(`/ideas/${idea.id}`)
    } catch (err) {
      const lic = asLicenseViolation(err)
      if (lic) setLicenseHint(`${lic.message} (${lic.reason})`)
      else setError((err as any)?.response?.data?.message ?? 'Submission failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <header className="mb-6">
        <div className="eyebrow">Neu</div>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Idee einreichen</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Beschreiben Sie das Problem, die vorgeschlagene Änderung und den erwarteten Nutzen.</p>
      </header>

      {licenseHint && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 mb-4 text-[13px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <strong className="font-medium">Lizenzgrenze erreicht.</strong> {licenseHint}
        </div>
      )}

      <form onSubmit={submit} className="card p-5 space-y-4">
        <div>
          <label className="label">Titel</label>
          <input
            className="input mt-1.5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Tickets aus internen Dokumenten automatisch verschlagworten"
            required maxLength={200}
          />
        </div>
        <div>
          <label className="label">Beschreibung</label>
          <textarea
            className="input mt-1.5 min-h-[160px] leading-relaxed"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Welches Problem löst das? Wer profitiert? Wie könnte die Einführung aussehen?"
            required maxLength={8000}
          />
          <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 tabular-nums font-mono">{description.length} / 8000</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Kategorie</label>
            <input
              className="input mt-1.5"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Produktivität, Daten, Personal…"
            />
          </div>
          <div>
            <label className="label">Kampagne</label>
            <select
              className="input mt-1.5"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">— keine —</option>
              {campaignsQ.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <div className="text-[13px] text-rose-600 dark:text-rose-400">{error}</div>}
        <div className="flex items-center gap-2 pt-1">
          <button className="btn-primary" disabled={busy}>{busy ? <><Spinner size={12} className="text-current" /> Wird gesendet…</> : 'Idee einreichen'}</button>
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Abbrechen</button>
        </div>
      </form>
    </div>
  )
}
