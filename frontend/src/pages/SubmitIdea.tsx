import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CampaignApi, IdeaApi, SearchApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'
import Spinner from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Lightbulb, Target, Sparkles, Users, AlertCircle, ArrowRight } from 'lucide-react'

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

  /**
   * Live duplicate detection. As the user types title + description, debounce
   * 500 ms and hit the semantic search to surface existing ideas above a
   * similarity threshold. Saves people from submitting near-duplicates and
   * makes the semantic search feature visible right where it's most useful.
   */
  const [dupQuery, setDupQuery] = useState('')
  useEffect(() => {
    const combined = `${title}\n${description}`.trim()
    // Need at least 6 chars in the title before checking — otherwise we either
    // hit noise or the user hasn't expressed an intent yet.
    if (title.trim().length < 6) {
      setDupQuery('')
      return
    }
    const t = setTimeout(() => setDupQuery(combined), 500)
    return () => clearTimeout(t)
  }, [title, description])

  const dupsQ = useQuery({
    queryKey: ['dup-check', dupQuery],
    queryFn: () => SearchApi.dupCheck(dupQuery),
    enabled: dupQuery.length > 0,
    // The query text rarely changes while the user is reviewing matches; cache
    // for a minute so toggling between fields doesn't refire.
    staleTime: 60_000,
  })
  // Threshold tuned to "strong match" — looser than the semantic search page
  // would use because we want to err on the side of warning here.
  const dups = (dupsQ.data ?? []).filter((d) => d.similarity >= 0.6).slice(0, 3)

  // Mirror the backend's @Size minimums so the user gets instant feedback instead
  // of a 400 round-trip. Keeps low-signal junk out of the embedding corpus.
  const titleOk = title.trim().length >= 5
  const descOk = description.trim().length >= 30
  const canSubmit = titleOk && descOk

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) {
      setError('Bitte geben Sie einen aussagekräftigen Titel (≥ 5 Zeichen) und eine Beschreibung (≥ 30 Zeichen) an.')
      return
    }
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <div className="eyebrow">Neu</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Idee einreichen</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Beschreiben Sie das Problem, die vorgeschlagene Änderung und den erwarteten Nutzen.</p>
      </header>

      {licenseHint && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 mb-4 text-[13px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <strong className="font-medium">Lizenzgrenze erreicht.</strong> {licenseHint}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <Card asChild>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              className="mt-1.5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Tickets aus internen Dokumenten automatisch verschlagworten"
              required minLength={5} maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              className="mt-1.5 min-h-[160px] leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Welches Problem löst das? Wer profitiert? Wie könnte die Einführung aussehen?"
              required minLength={30} maxLength={8000}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] font-mono tabular-nums">
              <span className={descOk ? 'text-muted-foreground/70' : 'text-amber-600 dark:text-amber-400'}>
                {descOk ? '✓ ausreichend' : `noch ${Math.max(0, 30 - description.trim().length)} Zeichen`}
              </span>
              <span className="text-muted-foreground/70">{description.length} / 8000</span>
            </div>
          </div>

          {dups.length > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-amber-900 dark:text-amber-200">
                <AlertCircle size={14} strokeWidth={2} />
                Ähnliche Ideen existieren bereits
              </div>
              <p className="mt-1 text-[12px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                Bevor Sie einreichen — vielleicht passt einer dieser Vorschläge bereits, oder Sie können
                Ihre Idee dort als Kommentar anhängen.
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {dups.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={`/ideas/${d.id}`}
                      target="_blank"
                      rel="noopener"
                      className="group flex items-start gap-2 rounded border border-amber-200/60 bg-card px-2.5 py-2 transition-colors hover:border-amber-400 dark:border-amber-900/40"
                    >
                      <ArrowRight size={12} strokeWidth={2} className="mt-1 shrink-0 text-amber-700 dark:text-amber-300 transition-transform group-hover:translate-x-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground tracking-tight truncate">{d.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{d.snippet}</div>
                      </div>
                      <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300 tabular-nums shrink-0 mt-0.5">
                        {(d.similarity * 100).toFixed(0)}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Input
                id="category"
                className="mt-1.5"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Produktivität, Daten, Personal…"
              />
            </div>
            <div>
              <Label htmlFor="campaign">Kampagne</Label>
              <select
                id="campaign"
                className="mt-1.5 flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          {error && <div className="text-[13px] text-destructive">{error}</div>}
          <div className="flex items-center gap-2 pt-1">
            <Button disabled={busy || !canSubmit}>{busy ? <><Spinner size={12} className="text-current" /> Wird gesendet…</> : 'Idee einreichen'}</Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Abbrechen</Button>
          </div>
        </form>
      </Card>

      <aside className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} strokeWidth={1.75} className="text-muted-foreground" />
            <div className="eyebrow">Tipps für eine gute Einreichung</div>
          </div>
          <ul className="mt-3 space-y-3 text-[13px] text-muted-foreground leading-relaxed">
            <li className="flex gap-2.5">
              <Target size={14} strokeWidth={1.75} className="text-foreground mt-0.5 shrink-0" />
              <span><span className="text-foreground font-medium">Beginnen Sie mit dem Problem.</span> Wer ist betroffen, was ist heute mühsam? Konkrete Beispiele schlagen abstrakte Beschreibungen.</span>
            </li>
            <li className="flex gap-2.5">
              <Sparkles size={14} strokeWidth={1.75} className="text-foreground mt-0.5 shrink-0" />
              <span><span className="text-foreground font-medium">Eine Idee pro Einreichung.</span> Wenn die Lösung mehrere Hebel hat, ist das eher ein Strang als eine Idee — splitten Sie sie auf.</span>
            </li>
            <li className="flex gap-2.5">
              <Users size={14} strokeWidth={1.75} className="text-foreground mt-0.5 shrink-0" />
              <span><span className="text-foreground font-medium">Nennen Sie den Nutzen messbar.</span> "Spart 3 Stunden pro Woche pro Team" lässt sich priorisieren, "wäre schön" nicht.</span>
            </li>
          </ul>
        </Card>

        <Card className="p-4">
          <div className="eyebrow">Was als Nächstes passiert</div>
          <ol className="mt-3 space-y-2 text-[12px] text-muted-foreground leading-relaxed">
            <li className="flex gap-2">
              <span className="font-mono text-foreground tabular-nums shrink-0">01</span>
              <span>Ihre Idee erhält den Status <span className="text-foreground">Eingereicht</span> und ist für Ihre Organisation sichtbar.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-foreground tabular-nums shrink-0">02</span>
              <span>Kolleg:innen können kommentieren und abstimmen.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-foreground tabular-nums shrink-0">03</span>
              <span>Prüfer bewerten nach Wirkung, Machbarkeit und strategischer Passung.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-foreground tabular-nums shrink-0">04</span>
              <span>Ideenmanager:innen verschieben die Idee weiter durch den Workflow.</span>
            </li>
          </ol>
        </Card>
      </aside>
      </div>
    </div>
  )
}
