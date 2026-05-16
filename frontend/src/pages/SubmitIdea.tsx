import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IdeaApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'

export default function SubmitIdea() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [licenseHint, setLicenseHint] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setLicenseHint(null)
    try {
      const idea = await IdeaApi.create({ title, description, category: category || undefined })
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
    <div className="p-4 md:p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Submit an idea</h1>
        <p className="text-slate-500 mt-1">Describe the problem, the proposed change, and the expected impact.</p>
      </header>

      {licenseHint && (
        <div className="card border-amber-200 bg-amber-50 p-4 mb-4 text-sm text-amber-900">
          <strong>License limit reached.</strong> {licenseHint}
        </div>
      )}

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Auto-tag tickets from internal docs"
            required maxLength={200}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input mt-1 min-h-[180px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What problem does this solve? Who benefits? What would the rollout look like?"
            required maxLength={8000}
          />
          <div className="mt-1 text-xs text-slate-400">{description.length} / 8000</div>
        </div>
        <div>
          <label className="label">Category (optional)</label>
          <input
            className="input mt-1 max-w-xs"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Productivity / Data / People / …"
          />
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <div className="flex items-center gap-2">
          <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit idea'}</button>
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
