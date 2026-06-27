import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { WorkflowApi, IdeaApi } from '@/api/endpoints'
import { stageLabels } from '@/components/StageBadge'
import { cn } from '@/lib/utils'
import { MessageSquare, ChevronUp, Sparkles, GripVertical } from 'lucide-react'
import type { Idea, Stage } from '@/types/api'

// The forward-flow columns shown on the board, left → right.
const BOARD_STAGES: Stage[] = [
  'SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION',
  'APPROVED', 'IN_IMPLEMENTATION', 'DONE',
]

// Accent colour per column header (matches the StageBadge palette).
const STAGE_ACCENT: Record<string, string> = {
  SUBMITTED:         'bg-blue-500',
  UNDER_REVIEW:      'bg-amber-500',
  PRIORITIZATION:    'bg-violet-500',
  APPROVED:          'bg-emerald-500',
  IN_IMPLEMENTATION: 'bg-cyan-500',
  DONE:              'bg-green-600',
}

export default function Workflow() {
  const qc = useQueryClient()
  const stagesQ = useQuery({ queryKey: ['workflow-stages'], queryFn: () => WorkflowApi.stages() })
  const ideasQ = useQuery({ queryKey: ['ideas'], queryFn: () => IdeaApi.list() })

  const ideas = ideasQ.data ?? []
  const allowed = stagesQ.data // Record<Stage, Stage[]> | undefined

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [draggingFrom, setDraggingFrom] = useState<Stage | null>(null)
  const [overStage, setOverStage] = useState<Stage | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  // Group ideas by stage once per data change.
  const byStage = useMemo(() => {
    const map: Record<string, Idea[]> = {}
    for (const s of BOARD_STAGES) map[s] = []
    for (const i of ideas) (map[i.stage] ??= []).push(i)
    return map
  }, [ideas])

  // Structural validity (role checks are enforced by the backend on drop).
  function canMove(from: Stage | null, to: Stage): boolean {
    if (!from || from === to) return false
    if (!allowed) return true // map not loaded yet → let the server decide
    return (allowed[from] ?? []).includes(to)
  }

  const move = useMutation({
    mutationFn: ({ id, to }: { id: string; to: Stage }) =>
      IdeaApi.transition(id, to, 'Per Kanban-Board verschoben'),
    // Optimistically move the card to the target column.
    onMutate: async ({ id, to }) => {
      setPendingId(id)
      await qc.cancelQueries({ queryKey: ['ideas'] })
      const prev = qc.getQueryData<Idea[]>(['ideas'])
      qc.setQueryData<Idea[]>(['ideas'], (old) =>
        (old ?? []).map((i) => (i.id === id ? { ...i, stage: to } : i)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      // Roll back; the global axios interceptor already surfaced a toast
      // (e.g. "Keine Berechtigung" for a 403).
      if (ctx?.prev) qc.setQueryData(['ideas'], ctx.prev)
    },
    onSettled: () => {
      setPendingId(null)
      qc.invalidateQueries({ queryKey: ['ideas'] })
    },
  })

  function handleDrop(to: Stage) {
    setOverStage(null)
    const id = draggingId
    const from = draggingFrom
    setDraggingId(null)
    setDraggingFrom(null)
    if (!id || !from) return
    if (!canMove(from, to)) return
    move.mutate({ id, to })
  }

  // Pin the board to the viewport (minus the h-14 app bar) so it scrolls
  // internally — horizontal across columns, vertical within each — instead of
  // growing the page and pushing the horizontal scrollbar below the fold.
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col p-4 md:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-5 shrink-0">
        <div className="eyebrow">Prozess</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Workflow-Board</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Ziehen Sie Ideen zwischen den Phasen, um sie weiterzubewegen. Nur erlaubte Übergänge sind möglich.
        </p>
      </header>

      <div className="flex-1 min-h-0 overflow-x-auto pb-4">
        <div className="flex gap-3 h-full min-w-max">
          {BOARD_STAGES.map((stage) => {
            const cards = byStage[stage] ?? []
            const isValidTarget = canMove(draggingFrom, stage)
            const isOver = overStage === stage
            const dragging = draggingId !== null

            return (
              <section
                key={stage}
                onDragOver={(e) => {
                  if (isValidTarget) {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move' // consistent "move" cursor over valid columns
                    setOverStage(stage)
                  }
                }}
                onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
                onDrop={(e) => { e.preventDefault(); handleDrop(stage) }}
                className={cn(
                  'flex w-72 shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors',
                  dragging && isValidTarget && 'border-dashed border-primary/50',
                  isOver && 'bg-primary/5 border-primary ring-1 ring-primary/40',
                  dragging && !isValidTarget && draggingFrom !== stage && 'opacity-60',
                  !dragging && 'border-border',
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/70 shrink-0">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', STAGE_ACCENT[stage] ?? 'bg-slate-400')} />
                  <h2 className="text-[13px] font-semibold text-foreground tracking-tight">{stageLabels[stage]}</h2>
                  <span className="ml-auto text-[11px] text-muted-foreground tabular-nums rounded bg-background px-1.5 py-0.5 border border-border">
                    {cards.length}
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
                  {cards.length === 0 && (
                    <div className={cn(
                      'rounded border border-dashed border-border/70 py-6 text-center text-[12px] text-muted-foreground/60',
                      isOver && 'border-primary/60 text-primary',
                    )}>
                      {isOver ? 'Hier ablegen' : 'Keine Ideen'}
                    </div>
                  )}

                  {cards.map((idea) => {
                    const isThisDragging = draggingId === idea.id
                    const isPending = pendingId === idea.id
                    return (
                      <article
                        key={idea.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', idea.id)
                          // Custom drag image: the browser default is a ~50%-alpha snapshot of
                          // the card, which reads as washed out. Clone the card off-screen with
                          // an opaque background + stronger shadow and hand that to the drag.
                          const card = e.currentTarget as HTMLElement
                          const rect = card.getBoundingClientRect()
                          const ghost = card.cloneNode(true) as HTMLElement
                          ghost.dataset.dragGhost = '1'
                          ghost.style.cssText =
                            `position:fixed;top:-10000px;left:-10000px;width:${rect.width}px;` +
                            'box-sizing:border-box;pointer-events:none;margin:0;' +
                            'background-color:rgb(var(--card));' +
                            'box-shadow:0 8px 24px rgba(0,0,0,0.28), 0 0 0 1px rgb(var(--border));'
                          document.body.appendChild(ghost)
                          e.dataTransfer.setDragImage(ghost, e.clientX - rect.left, e.clientY - rect.top)
                          // The browser rasterises the image right after dragstart returns;
                          // removing the clone on the next tick keeps the DOM clean.
                          setTimeout(() => ghost.remove(), 0)
                          setDraggingId(idea.id)
                          setDraggingFrom(idea.stage)
                        }}
                        onDragEnd={() => { setDraggingId(null); setDraggingFrom(null); setOverStage(null) }}
                        className={cn(
                          'group rounded-md border border-border bg-card p-2.5 shadow-sm cursor-grab active:cursor-grabbing transition-all',
                          'hover:border-input hover:shadow',
                          // Origin slot while dragging: keep it readable (the opaque ghost is
                          // what follows the cursor) and mark it as the source with a dashed edge.
                          isThisDragging && 'opacity-60 border-dashed',
                          isPending && 'opacity-60 pointer-events-none',
                        )}
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={13} className="mt-0.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                          <Link
                            to={`/ideas/${idea.id}`}
                            draggable={false}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-0 text-[13px] font-medium text-foreground leading-snug tracking-tight hover:underline"
                          >
                            {idea.title}
                          </Link>
                        </div>

                        {idea.category && (
                          <div className="mt-1.5 ml-[1.375rem]">
                            <span className="inline-block rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                              {idea.category}
                            </span>
                          </div>
                        )}

                        <div className="mt-2 ml-[1.375rem] flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1" title="Netto-Stimmen">
                            <ChevronUp size={12} strokeWidth={2} /> {idea.netVotes}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Kommentare">
                            <MessageSquare size={11} strokeWidth={1.75} /> {idea.commentCount}
                          </span>
                          {idea.sponsorBoost && (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Vom Sponsor gefördert">
                              <Sparkles size={11} strokeWidth={1.75} />
                            </span>
                          )}
                          <span className="ml-auto truncate max-w-[6rem] text-muted-foreground/70" title={idea.authorName}>
                            {idea.authorName}
                          </span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
