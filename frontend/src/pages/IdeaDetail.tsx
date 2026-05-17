import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IdeaApi, WorkflowApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'
import StageBadge, { stageLabels } from '@/components/StageBadge'
import RoleGate from '@/components/RoleGate'
import { useAuth } from '@/store/auth'
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

  if (ideaQ.isLoading || !ideaQ.data) return <div className="p-8 text-sm text-slate-500 dark:text-slate-400">Wird geladen…</div>
  const idea = ideaQ.data
  const reachable = stagesQ.data?.[idea.stage] ?? []

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <StageBadge stage={idea.stage} />
            {idea.sponsorBoost && <span className="badge-gray uppercase tracking-wider text-[10px]">gefördert</span>}
            {idea.priorityScore != null && (
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 tabular-nums">
                P {idea.priorityScore.toFixed(2)}
              </span>
            )}
            {idea.category && <span className="badge-gray">{idea.category}</span>}
            {idea.campaignId && idea.campaignName && (
              <Link
                to={`/campaigns/${idea.campaignId}`}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded px-1.5 py-0.5"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: idea.campaignColor ?? '#6366f1' }} aria-hidden />
                {idea.campaignName}
              </Link>
            )}
          </div>
          <h1 className="mt-3 text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-tight tracking-tight break-words">{idea.title}</h1>
          <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
            <span className="text-slate-700 dark:text-slate-300">{idea.authorName}</span>
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            <span className="tabular-nums">{new Date(idea.createdAt).toLocaleDateString('de-DE')}</span>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded p-1.5 flex sm:flex-col items-center gap-0.5 self-start">
          <button className="btn-ghost h-7 w-7 p-0" onClick={() => voteM.mutate(1)} title="Hochstimmen"><ArrowUp size={16} strokeWidth={1.75} /></button>
          <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 tabular-nums px-1">{idea.netVotes > 0 ? '+' : ''}{idea.netVotes}</div>
          <button className="btn-ghost h-7 w-7 p-0" onClick={() => voteM.mutate(-1)} title="Runterstimmen"><ArrowDown size={16} strokeWidth={1.75} /></button>
        </div>
      </div>

      <p className="mt-6 whitespace-pre-wrap text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed">{idea.description}</p>

      <div className="mt-8 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="card p-4">
            <div className="eyebrow">Workflow</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {reachable.length === 0 && <div className="text-[13px] text-slate-500 dark:text-slate-400">Keine weiteren Übergänge.</div>}
              {reachable.map((s) => (
                <button key={s} className="btn-secondary text-[12px]" onClick={() => transitionM.mutate(s)}>
                  → {stageLabels[s]}
                </button>
              ))}
              <RoleGate allow={['SPONSOR', 'ADMIN']}>
                <button className="btn-ghost text-[12px]" onClick={() => boostM.mutate(!idea.sponsorBoost)}>
                  {idea.sponsorBoost ? 'Förderung entfernen' : 'Sponsor-Förderung'}
                </button>
              </RoleGate>
            </div>
            {historyQ.data && historyQ.data.length > 0 && (
              <ol className="mt-4 border-l border-slate-200 dark:border-slate-800 ml-px space-y-2.5">
                {historyQ.data.map((h) => (
                  <li key={h.id} className="pl-3 relative">
                    <span className="absolute -left-[3px] top-[7px] h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-slate-100" />
                    <div className="text-[13px] text-slate-800 dark:text-slate-200">
                      <span className="font-medium">{h.actorName}</span>{' '}
                      verschob {h.fromStage ? stageLabels[h.fromStage] : '—'} → <span className="font-medium">{stageLabels[h.toStage]}</span>
                    </div>
                    {h.reason && <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{h.reason}</div>}
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">{new Date(h.createdAt).toLocaleString('de-DE')}</div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Discussion above Evaluation: same input position regardless of role. */}
          <section className="card p-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} strokeWidth={1.75} className="text-slate-500 dark:text-slate-400" />
              <div className="eyebrow">Diskussion</div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums ml-auto">{commentsQ.data?.length ?? 0}</span>
            </div>
            <div className="mt-3 space-y-3">
              {commentsQ.data?.map((c) => (
                <div key={c.id} className="text-[13px]">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{c.userName} <span className="text-slate-400 dark:text-slate-500 font-normal tabular-nums">· {new Date(c.createdAt).toLocaleString('de-DE')}</span></div>
                  <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{c.body}</div>
                </div>
              ))}
              {(commentsQ.data?.length ?? 0) === 0 && <div className="text-[13px] text-slate-500 dark:text-slate-400">Noch keine Kommentare.</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="input flex-1"
                placeholder="Kommentar hinzufügen…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) commentM.mutate() }}
              />
              <button className="btn-primary" disabled={!comment.trim() || commentM.isPending} onClick={() => commentM.mutate()}>
                {commentM.isPending ? 'Wird gesendet…' : 'Senden'}
              </button>
            </div>
          </section>

          <RoleGate allow={['REVIEWER', 'INNOVATION_MANAGER', 'ADMIN']}>
            <section className="card p-4">
              <div className="flex items-center gap-2">
                <Star size={14} strokeWidth={1.75} className="text-slate-500 dark:text-slate-400" />
                <div className="eyebrow">Bewertung durch Prüfer</div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {RATING_AXES.map((a) => (
                  <div key={a.key} className="flex sm:block items-center gap-3">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium w-24 sm:w-auto shrink-0">{a.label}</div>
                    <div className="sm:mt-1.5 flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setRating({ ...rating, [a.key]: n })}
                          className={`h-7 w-7 rounded border text-[12px] font-medium tabular-nums transition ${
                            rating[a.key] === n
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100'
                          }`}
                        >{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                className="input mt-3 min-h-[72px]"
                placeholder="Prüfer-Notizen — Teil Ihrer Bewertung, nicht als Kommentar veröffentlicht…"
                value={rating.notes}
                onChange={(e) => setRating({ ...rating, notes: e.target.value })}
              />
              <button className="btn-primary mt-3" onClick={() => evalM.mutate()}>Bewertung speichern</button>

              {evalsQ.data && evalsQ.data.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                  {evalsQ.data.map((e) => (
                    <div key={e.id} className="text-[13px]">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{e.reviewerName}</div>
                      <div className="text-slate-600 dark:text-slate-400 tabular-nums">
                        Wirkung {e.impact} · Machbarkeit {e.feasibility} · Strategie-Fit {e.strategicFit}
                        <span className="ml-2 font-mono text-slate-900 dark:text-slate-100">Ø {e.average.toFixed(2)}</span>
                      </div>
                      {e.notes && <div className="text-slate-500 dark:text-slate-400 mt-0.5">"{e.notes}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </RoleGate>
        </div>

        <aside className="space-y-4">
          <RoleGate allow={['INNOVATION_MANAGER', 'REVIEWER', 'ADMIN']}>
            <section className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wand2 size={14} strokeWidth={1.75} className="text-slate-500 dark:text-slate-400" />
                  <div className="eyebrow">KI-Assistent</div>
                </div>
                {aiOpen && (
                  <button className="btn-ghost text-[11px] -mr-1" onClick={resetAiChat} title="Neues Gespräch beginnen">
                    <RotateCcw size={12} /> Zurücksetzen
                  </button>
                )}
              </div>

              {!aiOpen && (
                <>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Schlägt Verbesserungen auf Basis verwandter Ideen vor und beantwortet anschließend Rückfragen.
                  </p>
                  <button
                    className="btn-secondary mt-3 w-full"
                    onClick={startAiChat}
                    disabled={aiBusy}
                  >
                    {aiBusy ? 'Wird gestartet…' : 'Diese Idee verfeinern'}
                  </button>
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
                    className="border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 p-2.5 space-y-2 max-h-[28rem] overflow-y-auto"
                  >
                    {aiMessages.map((m, i) => (
                      <div
                        key={i}
                        className={
                          m.role === 'assistant'
                            ? 'text-[12px] whitespace-pre-wrap text-slate-800 bg-white border border-slate-200 rounded p-2 leading-relaxed dark:text-slate-200 dark:bg-slate-900 dark:border-slate-800'
                            : 'text-[12px] whitespace-pre-wrap text-white bg-slate-900 rounded p-2 ml-6 leading-relaxed dark:text-slate-900 dark:bg-slate-100'
                        }
                      >
                        {m.content}
                      </div>
                    ))}
                    {aiBusy && (
                      <div className="text-[12px] text-slate-500 dark:text-slate-400 italic">Denkt nach…</div>
                    )}
                    {aiError && (
                      <div className="text-[12px] text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-900">{aiError}</div>
                    )}
                  </div>

                  <div className="mt-2 flex gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Rückfrage stellen…"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage() } }}
                      disabled={aiBusy}
                    />
                    <button
                      className="btn-primary"
                      onClick={sendAiMessage}
                      disabled={aiBusy || !aiInput.trim()}
                      title="Senden"
                    >
                      <Send size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </RoleGate>

          <section className="card p-4">
            <div className="eyebrow">Ähnliche Ideen</div>
            <div className="mt-3 space-y-2">
              {(similarQ.data ?? []).length === 0 && <div className="text-[13px] text-slate-500 dark:text-slate-400">Keine nahen Treffer.</div>}
              {similarQ.data?.map((s) => (
                <a key={s.id} href={`/ideas/${s.id}`} className="block hover:bg-slate-50 dark:hover:bg-slate-800 rounded p-2 -mx-2 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-[13px] tracking-tight">{s.title}</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{(s.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{s.snippet}</div>
                </a>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
