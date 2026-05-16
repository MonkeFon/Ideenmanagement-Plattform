import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IdeaApi, WorkflowApi } from '@/api/endpoints'
import { asLicenseViolation } from '@/api/client'
import StageBadge, { stageLabels } from '@/components/StageBadge'
import RoleGate from '@/components/RoleGate'
import { useAuth } from '@/store/auth'
import { ArrowUp, ArrowDown, MessageSquare, Sparkles, Star } from 'lucide-react'
import type { Stage } from '@/types/api'

const RATING_AXES = [
  { key: 'impact',       label: 'Impact' },
  { key: 'feasibility',  label: 'Feasibility' },
  { key: 'strategicFit', label: 'Strategic fit' },
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
  const [refineHint, setRefineHint] = useState<string | null>(null)
  const [licenseHint, setLicenseHint] = useState<string | null>(null)
  const [rating, setRating] = useState({ impact: 3, feasibility: 3, strategicFit: 3, notes: '' })

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

  async function runRefine() {
    setRefineHint(null); setLicenseHint(null)
    try {
      const res = await IdeaApi.refine(id)
      const lines = [...res.suggestions.map((s) => '• ' + s)]
      if (res.rationale) lines.push('', 'Rationale: ' + res.rationale)
      setRefineHint(lines.join('\n'))
    } catch (err) {
      const lic = asLicenseViolation(err)
      if (lic) setLicenseHint(`${lic.message} (${lic.reason})`)
      else setRefineHint('Refinement failed — check that the LLM provider is reachable.')
    }
  }

  if (ideaQ.isLoading || !ideaQ.data) return <div className="p-8 text-slate-500">Loading…</div>
  const idea = ideaQ.data
  const reachable = stagesQ.data?.[idea.stage] ?? []

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StageBadge stage={idea.stage} />
            {idea.sponsorBoost && <span className="badge-blue flex items-center gap-1"><Sparkles size={12} /> Sponsor boost</span>}
            {idea.priorityScore != null && <span className="badge-gray">Priority {idea.priorityScore.toFixed(2)}</span>}
            {idea.category && <span className="badge-gray">{idea.category}</span>}
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-slate-900 leading-tight break-words">{idea.title}</h1>
          <div className="mt-1 text-sm text-slate-500">by {idea.authorName} · {new Date(idea.createdAt).toLocaleDateString()}</div>
        </div>

        <div className="card p-3 sm:p-4 flex sm:flex-col items-center justify-center gap-1 self-start">
          <button className="btn-ghost" onClick={() => voteM.mutate(1)}><ArrowUp size={20} /></button>
          <div className="text-2xl font-semibold text-slate-900">{idea.netVotes}</div>
          <button className="btn-ghost" onClick={() => voteM.mutate(-1)}><ArrowDown size={20} /></button>
        </div>
      </div>

      <p className="mt-6 whitespace-pre-wrap text-slate-700 leading-relaxed">{idea.description}</p>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Workflow</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {reachable.length === 0 && <div className="text-sm text-slate-500">No further transitions.</div>}
              {reachable.map((s) => (
                <button key={s} className="btn-secondary" onClick={() => transitionM.mutate(s)}>
                  Move → {stageLabels[s]}
                </button>
              ))}
              <RoleGate allow={['SPONSOR', 'ADMIN']}>
                <button className="btn-ghost" onClick={() => boostM.mutate(!idea.sponsorBoost)}>
                  {idea.sponsorBoost ? 'Remove sponsor boost' : 'Add sponsor boost'}
                </button>
              </RoleGate>
            </div>
            {historyQ.data && historyQ.data.length > 0 && (
              <ol className="mt-4 border-l border-surface-border ml-1 space-y-3">
                {historyQ.data.map((h) => (
                  <li key={h.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
                    <div className="text-sm">
                      <span className="font-medium">{h.actorName}</span>{' '}
                      moved {h.fromStage ? stageLabels[h.fromStage] : '—'} → <strong>{stageLabels[h.toStage]}</strong>
                    </div>
                    {h.reason && <div className="text-xs text-slate-500 mt-0.5">{h.reason}</div>}
                    <div className="text-xs text-slate-400 mt-0.5">{new Date(h.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Discussion sits above Evaluation so the comment input is at a predictable position
              for every role and isn't visually confused with the reviewer notes textarea. */}
          <section className="card p-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><MessageSquare size={16} /> Discussion</h2>
            <div className="mt-3 space-y-3">
              {commentsQ.data?.map((c) => (
                <div key={c.id} className="text-sm">
                  <div className="font-medium text-slate-900">{c.userName} <span className="text-slate-400 font-normal">· {new Date(c.createdAt).toLocaleString()}</span></div>
                  <div className="text-slate-700 whitespace-pre-wrap">{c.body}</div>
                </div>
              ))}
              {(commentsQ.data?.length ?? 0) === 0 && <div className="text-sm text-slate-500">Be the first to comment.</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className="input flex-1"
                placeholder="Add a comment — visible to everyone in your tenant…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) commentM.mutate() }}
              />
              <button className="btn-primary" disabled={!comment.trim() || commentM.isPending} onClick={() => commentM.mutate()}>
                {commentM.isPending ? 'Posting…' : 'Post'}
              </button>
            </div>
          </section>

          <RoleGate allow={['REVIEWER', 'INNOVATION_MANAGER', 'ADMIN']}>
            <section className="card p-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Star size={16} /> Reviewer evaluation</h2>
              <div className="mt-3 grid grid-cols-3 gap-4">
                {RATING_AXES.map((a) => (
                  <div key={a.key}>
                    <div className="label">{a.label}</div>
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setRating({ ...rating, [a.key]: n })}
                          className={`h-8 w-8 rounded border text-sm font-medium ${rating[a.key] === n ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-surface-border text-slate-600'}`}
                        >{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                className="input mt-3 min-h-[80px]"
                placeholder="Reviewer notes — attached to your score, not posted as a comment…"
                value={rating.notes}
                onChange={(e) => setRating({ ...rating, notes: e.target.value })}
              />
              <button className="btn-primary mt-3" onClick={() => evalM.mutate()}>Save evaluation</button>

              {evalsQ.data && evalsQ.data.length > 0 && (
                <div className="mt-5 space-y-3 border-t border-surface-border pt-4">
                  {evalsQ.data.map((e) => (
                    <div key={e.id} className="text-sm">
                      <div className="font-medium text-slate-900">{e.reviewerName}</div>
                      <div className="text-slate-600">
                        Impact {e.impact} · Feasibility {e.feasibility} · Fit {e.strategicFit} · <strong>avg {e.average.toFixed(2)}</strong>
                      </div>
                      {e.notes && <div className="text-slate-500 mt-0.5">"{e.notes}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </RoleGate>
        </div>

        <aside className="space-y-6">
          <RoleGate allow={['INNOVATION_MANAGER', 'REVIEWER', 'ADMIN']}>
            <section className="card p-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Sparkles size={16} /> AI refine</h2>
              <p className="text-sm text-slate-500 mt-1">
                Pulls related internal ideas and asks the LLM for sharpening suggestions.
              </p>
              <button className="btn-secondary mt-3 w-full" onClick={runRefine}>Refine this idea</button>
              {licenseHint && (
                <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                  {licenseHint} — upgrade your plan to enable AI refine.
                </div>
              )}
              {refineHint && (
                <pre className="mt-3 text-xs whitespace-pre-wrap text-slate-700 bg-slate-50 p-3 rounded border border-surface-border">{refineHint}</pre>
              )}
            </section>
          </RoleGate>

          <section className="card p-5">
            <h2 className="font-semibold text-slate-900">Similar past ideas</h2>
            <p className="text-sm text-slate-500 mt-1">Top-k semantic neighbours from this tenant.</p>
            <div className="mt-3 space-y-3">
              {(similarQ.data ?? []).length === 0 && <div className="text-sm text-slate-500">No close matches.</div>}
              {similarQ.data?.map((s) => (
                <a key={s.id} href={`/ideas/${s.id}`} className="block hover:bg-slate-50 rounded p-2 -mx-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 text-sm">{s.title}</span>
                    <span className="badge-blue">{(s.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{s.snippet}</div>
                </a>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
