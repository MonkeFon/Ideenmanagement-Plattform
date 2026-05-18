import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IdeaApi, WorkflowApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'
import StageBadge, { stageLabels } from '@/components/StageBadge'
import RoleGate from '@/components/RoleGate'
import Spinner, { PageSpinner } from '@/components/Spinner'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown, MessageSquare, Send, Wand2, Star, RotateCcw } from 'lucide-react'
import type { ChatMessage, Stage } from '@/types/api'

const RATING_AXES = [
  { key: 'impact',       label: 'Wirkung' },
  { key: 'feasibility',  label: 'Machbarkeit' },
  { key: 'strategicFit', label: 'Strategie-Fit' },
] as const

export default function IdeaDetail() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const user = useAuth((s) => s.user)!

  const ideaQ = useQuery({ queryKey: ['idea', id], queryFn: () => IdeaApi.get(id) })
  const similarQ = useQuery({ queryKey: ['idea', id, 'similar'], queryFn: () => IdeaApi.similar(id) })
  const commentsQ = useQuery({ queryKey: ['idea', id, 'comments'], queryFn: () => IdeaApi.listComments(id) })
  const evalsQ = useQuery({ queryKey: ['idea', id, 'evals'], queryFn: () => IdeaApi.listEvaluations(id) })
  const historyQ = useQuery({ queryKey: ['idea', id, 'history'], queryFn: () => WorkflowApi.history(id) })
  const stagesQ = useQuery({ queryKey: ['workflow-stages'], queryFn: () => WorkflowApi.stages() })

  const [comment, setComment] = useState('')
  const [licenseHint, setLicenseHint] = useState<string | null>(null)
  const [rating, setRating] = useState({ impact: 3, feasibility: 3, strategicFit: 3, notes: '' })

  const [aiOpen, setAiOpen] = useState(false)
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const aiScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight
  }, [aiMessages, aiBusy])

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['idea', id] })
    qc.invalidateQueries({ queryKey: ['ideas'] })
  }

  const voteM = useMutation({
    mutationFn: (v: -1 | 1) => IdeaApi.vote(id, v),
    onSuccess: refresh,
  })

  const commentM = useMutation({
    mutationFn: () => IdeaApi.addComment(id, comment),
    onSuccess: () => { setComment(''); refresh() },
  })

  const evalM = useMutation({
    mutationFn: () => IdeaApi.evaluate(id, rating),
    onSuccess: refresh,
  })

  const transitionM = useMutation({
    mutationFn: (to: Stage) => IdeaApi.transition(id, to),
    onSuccess: refresh,
  })

  const boostM = useMutation({
    mutationFn: (on: boolean) => IdeaApi.setSponsorBoost(id, on),
    onSuccess: refresh,
  })

  async function startAiChat() {
    setAiOpen(true)
    setLicenseHint(null); setAiError(null)
    setAiMessages([]); setAiInput('')
    setAiBusy(true)
    try {
      const res = await IdeaApi.refine(id)
      const lines: string[] = []
      if (res.suggestions.length) {
        lines.push('Vorschläge zur Schärfung dieser Idee:')
        res.suggestions.forEach((s) => lines.push('• ' + s))
      }
      if (res.rationale) {
        if (lines.length) lines.push('')
        lines.push('Begründung: ' + res.rationale)
      }
      if (!lines.length) lines.push('Ich konnte keine Vorschläge generieren — stellen Sie gerne eine Rückfrage zu dieser Idee.')
      lines.push('', 'Stellen Sie unten eine Rückfrage.')
      setAiMessages([{ role: 'assistant', content: lines.join('\n') }])
    } catch (err) {
      const lic = asLicenseViolation(err)
      if (lic) { setLicenseHint(`${lic.message} (${lic.reason})`); setAiOpen(false) }
      else setAiError('Verfeinerung fehlgeschlagen — prüfen Sie, ob das LLM erreichbar ist.')
    } finally {
      setAiBusy(false)
    }
  }

  async function sendAiMessage() {
    const text = aiInput.trim()
    if (!text || aiBusy) return
    const next: ChatMessage[] = [...aiMessages, { role: 'user', content: text }]
    setAiMessages(next); setAiInput(''); setAiBusy(true); setAiError(null)
    try {
      const res = await IdeaApi.chat(id, next)
      setAiMessages([...next, { role: 'assistant', content: res.reply || '(leere Antwort)' }])
    } catch (err) {
      const lic = asLicenseViolation(err)
      if (lic) setAiError(`${lic.message} (${lic.reason})`)
      else setAiError('Antwort fehlgeschlagen — das LLM lädt evtl. noch. Bitte gleich erneut versuchen.')
    } finally {
      setAiBusy(false)
    }
  }

  function resetAiChat() {
    setAiMessages([]); setAiInput(''); setAiError(null); setAiOpen(false)
  }

  if (ideaQ.isLoading || !ideaQ.data) return <PageSpinner />
  const idea = ideaQ.data
  const reachable = stagesQ.data?.[idea.stage] ?? []

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <StageBadge stage={idea.stage} />
            {idea.sponsorBoost && <Badge variant="gray" className="uppercase tracking-wider text-[10px]">gefördert</Badge>}
            {idea.priorityScore != null && (
              <Badge variant="outline" className="font-mono text-[11px] text-foreground/90 tabular-nums">
                P {idea.priorityScore.toFixed(2)}
              </Badge>
            )}
            {idea.category && <Badge variant="gray">{idea.category}</Badge>}
            {idea.campaignId && idea.campaignName && (
              <Link to={`/campaigns/${idea.campaignId}`}>
                <Badge variant="outline" className="gap-1.5 text-[11px] text-foreground/90 hover:border-foreground/30">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: idea.campaignColor ?? '#6366f1' }} aria-hidden />
                  {idea.campaignName}
                </Badge>
              </Link>
            )}
          </div>
          <h1 className="mt-3 text-xl md:text-2xl font-semibold text-foreground leading-tight tracking-tight break-words">{idea.title}</h1>
          <div className="mt-1 text-[12px] text-muted-foreground">
            <span className="text-foreground/90">{idea.authorName}</span>
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span className="tabular-nums">{new Date(idea.createdAt).toLocaleDateString('de-DE')}</span>
          </div>
        </div>

        <div className="border border-border rounded p-1.5 flex sm:flex-col items-center gap-0.5 self-start">
          <Button variant="ghost" size="icon" onClick={() => voteM.mutate(1)} title="Hochstimmen"><ArrowUp size={16} strokeWidth={1.75} /></Button>
          <div className="text-[13px] font-semibold text-foreground tabular-nums px-1">{idea.netVotes > 0 ? '+' : ''}{idea.netVotes}</div>
          <Button variant="ghost" size="icon" onClick={() => voteM.mutate(-1)} title="Runterstimmen"><ArrowDown size={16} strokeWidth={1.75} /></Button>
        </div>
      </div>

      <p className="mt-6 whitespace-pre-wrap text-[14px] text-foreground/90 leading-relaxed">{idea.description}</p>

      <div className="mt-8 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="eyebrow">Workflow</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {reachable.length === 0 && <div className="text-[13px] text-muted-foreground">Keine weiteren Übergänge.</div>}
              {reachable.map((s) => (
                <Button key={s} variant="secondary" size="sm" onClick={() => transitionM.mutate(s)}>
                  → {stageLabels[s]}
                </Button>
              ))}
              <RoleGate allow={['SPONSOR', 'ADMIN']}>
                <Button variant="ghost" size="sm" onClick={() => boostM.mutate(!idea.sponsorBoost)}>
                  {idea.sponsorBoost ? 'Förderung entfernen' : 'Sponsor-Förderung'}
                </Button>
              </RoleGate>
            </div>
            {historyQ.data && historyQ.data.length > 0 && (
              <ol className="mt-4 border-l border-border ml-px space-y-2.5">
                {historyQ.data.map((h) => (
                  <li key={h.id} className="pl-3 relative">
                    <span className="absolute -left-[3px] top-[7px] h-1.5 w-1.5 rounded-full bg-primary" />
                    <div className="text-[13px] text-foreground/90">
                      <span className="font-medium">{h.actorName}</span>{' '}
                      verschob {h.fromStage ? stageLabels[h.fromStage] : '—'} → <span className="font-medium">{stageLabels[h.toStage]}</span>
                    </div>
                    {h.reason && <div className="text-[12px] text-muted-foreground mt-0.5">{h.reason}</div>}
                    <div className="text-[11px] text-muted-foreground/70 mt-0.5 tabular-nums">{new Date(h.createdAt).toLocaleString('de-DE')}</div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Discussion above Evaluation: same input position regardless of role. */}
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} strokeWidth={1.75} className="text-muted-foreground" />
              <div className="eyebrow">Diskussion</div>
              <span className="text-[11px] text-muted-foreground/70 tabular-nums ml-auto">{commentsQ.data?.length ?? 0}</span>
            </div>
            <div className="mt-3 space-y-3">
              {commentsQ.data?.map((c) => (
                <div key={c.id} className="text-[13px]">
                  <div className="font-medium text-foreground">{c.userName} <span className="text-muted-foreground/70 font-normal tabular-nums">· {new Date(c.createdAt).toLocaleString('de-DE')}</span></div>
                  <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{c.body}</div>
                </div>
              ))}
              {(commentsQ.data?.length ?? 0) === 0 && <div className="text-[13px] text-muted-foreground">Noch keine Kommentare.</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                className="flex-1"
                placeholder="Kommentar hinzufügen…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) commentM.mutate() }}
              />
              <Button disabled={!comment.trim() || commentM.isPending} onClick={() => commentM.mutate()}>
                {commentM.isPending ? <><Spinner size={12} className="text-current" /> Wird gesendet…</> : 'Senden'}
              </Button>
            </div>
          </Card>

          <RoleGate allow={['REVIEWER', 'INNOVATION_MANAGER', 'ADMIN']}>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Star size={14} strokeWidth={1.75} className="text-muted-foreground" />
                <div className="eyebrow">Bewertung durch Prüfer</div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {RATING_AXES.map((a) => (
                  <div key={a.key} className="flex sm:block items-center gap-3">
                    <div className="text-[11px] text-muted-foreground font-medium w-24 sm:w-auto shrink-0">{a.label}</div>
                    <div className="sm:mt-1.5 flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setRating({ ...rating, [a.key]: n })}
                          className={cn(
                            'h-7 w-7 rounded border text-[12px] font-medium tabular-nums transition-colors',
                            rating[a.key] === n
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input text-muted-foreground hover:text-foreground hover:border-foreground/30',
                          )}
                        >{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Textarea
                className="mt-3 min-h-[72px]"
                placeholder="Prüfer-Notizen — Teil Ihrer Bewertung, nicht als Kommentar veröffentlicht…"
                value={rating.notes}
                onChange={(e) => setRating({ ...rating, notes: e.target.value })}
              />
              <Button className="mt-3" onClick={() => evalM.mutate()}>Bewertung speichern</Button>

              {evalsQ.data && evalsQ.data.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-border pt-3">
                  {evalsQ.data.map((e) => (
                    <div key={e.id} className="text-[13px]">
                      <div className="font-medium text-foreground">{e.reviewerName}</div>
                      <div className="text-muted-foreground tabular-nums">
                        Wirkung {e.impact} · Machbarkeit {e.feasibility} · Strategie-Fit {e.strategicFit}
                        <span className="ml-2 font-mono text-foreground">Ø {e.average.toFixed(2)}</span>
                      </div>
                      {e.notes && <div className="text-muted-foreground mt-0.5">"{e.notes}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </RoleGate>
        </div>

        <aside className="space-y-4">
          <RoleGate allow={['INNOVATION_MANAGER', 'REVIEWER', 'ADMIN']}>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wand2 size={14} strokeWidth={1.75} className="text-muted-foreground" />
                  <div className="eyebrow">KI-Assistent</div>
                </div>
                {aiOpen && (
                  <Button variant="ghost" size="sm" className="-mr-1 text-[11px]" onClick={resetAiChat} title="Neues Gespräch beginnen">
                    <RotateCcw size={12} /> Zurücksetzen
                  </Button>
                )}
              </div>

              {!aiOpen && (
                <>
                  <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                    Schlägt Verbesserungen auf Basis verwandter Ideen vor und beantwortet anschließend Rückfragen.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={startAiChat}
                    disabled={aiBusy}
                  >
                    {aiBusy ? <><Spinner size={12} className="text-current" /> Wird gestartet…</> : 'Diese Idee verfeinern'}
                  </Button>
                </>
              )}

              {licenseHint && (
                <div className="mt-3 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900">
                  {licenseHint}
                </div>
              )}

              {aiOpen && (
                <div className="mt-3 flex flex-col">
                  <div
                    ref={aiScrollRef}
                    className="border border-border rounded bg-muted p-2.5 space-y-2 max-h-[28rem] overflow-y-auto"
                  >
                    {aiMessages.map((m, i) => (
                      <div
                        key={i}
                        className={cn(
                          'text-[12px] whitespace-pre-wrap rounded p-2 leading-relaxed',
                          m.role === 'assistant'
                            ? 'bg-card text-foreground/90 border border-border'
                            : 'bg-primary text-primary-foreground ml-6',
                        )}
                      >
                        {m.content}
                      </div>
                    ))}
                    {aiBusy && (
                      <Spinner label="Denkt nach…" className="text-[12px] italic px-2 py-1" />
                    )}
                    {aiError && (
                      <div className="text-[12px] text-destructive bg-destructive/10 border border-destructive/30 rounded p-2">{aiError}</div>
                    )}
                  </div>

                  <div className="mt-2 flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Rückfrage stellen…"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage() } }}
                      disabled={aiBusy}
                    />
                    <Button
                      onClick={sendAiMessage}
                      disabled={aiBusy || !aiInput.trim()}
                      size="icon"
                      title="Senden"
                    >
                      <Send size={14} strokeWidth={1.75} />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </RoleGate>

          <Card className="p-4">
            <div className="eyebrow">Ähnliche Ideen</div>
            <div className="mt-3 space-y-2">
              {(similarQ.data ?? []).length === 0 && <div className="text-[13px] text-muted-foreground">Keine nahen Treffer.</div>}
              {similarQ.data?.map((s) => (
                <a key={s.id} href={`/ideas/${s.id}`} className="block hover:bg-accent rounded p-2 -mx-2 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground text-[13px] tracking-tight">{s.title}</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{(s.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{s.snippet}</div>
                </a>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
