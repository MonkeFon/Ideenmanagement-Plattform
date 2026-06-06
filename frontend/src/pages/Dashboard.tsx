import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { IdeaApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import IdeaCardSkeleton from '@/components/IdeaCardSkeleton'
import StageBadge from '@/components/StageBadge'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/store/auth'
import { Plus, ArrowBigUp, MessageSquare, Lightbulb } from 'lucide-react'
import type { Comment, Idea, Stage } from '@/types/api'

function fmtDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}

// Pipeline order for the per-status breakdowns.
const STATUS_ORDER: Stage[] = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION',
  'APPROVED', 'IN_IMPLEMENTATION', 'DONE', 'REJECTED', 'ARCHIVED',
]

function countByStage(list: Idea[]): Record<string, number> {
  const m: Record<string, number> = {}
  for (const i of list) m[i.stage] = (m[i.stage] ?? 0) + 1
  return m
}

export default function Dashboard() {
  const user = useAuth((s) => s.user)!
  const ideasQ = useQuery({ queryKey: ['ideas'], queryFn: () => IdeaApi.list() })
  const ideas: Idea[] = ideasQ.data ?? []

  // "Diese Woche im Trend": the most up-voted ideas still in the open pipeline.
  const open = ideas.filter((i) => ['SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION'].includes(i.stage))
  const trending = [...open].sort((a, b) => b.netVotes - a.netVotes).slice(0, 3)

  // Meine Ideen — filter the already-loaded tenant list by author (no extra request).
  const myIdeas = ideas
    .filter((i) => i.authorId === user.id)
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))

  // Meine Kommentare — there's no "my comments" endpoint, so fetch comment threads
  // only for ideas that actually have comments (commentCount > 0) and keep the ones
  // I authored. Reuses IdeaDetail's query keys, so the cache is shared.
  const commentable = ideas.filter((i) => i.commentCount > 0)
  const commentQs = useQueries({
    queries: commentable.map((i) => ({
      queryKey: ['idea', i.id, 'comments'],
      queryFn: () => IdeaApi.listComments(i.id),
      enabled: commentable.length > 0,
      staleTime: 60_000,
    })),
  })
  const commentsLoading = commentable.length > 0 && commentQs.some((q) => q.isLoading)
  const myComments: { comment: Comment; idea: Idea }[] = []
  commentQs.forEach((q, idx) => {
    const idea = commentable[idx]
    if (!idea || !q.data) return
    q.data.forEach((c) => { if (c.userId === user.id) myComments.push({ comment: c, idea }) })
  })
  myComments.sort((a, b) => (Date.parse(b.comment.createdAt) || 0) - (Date.parse(a.comment.createdAt) || 0))

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Übersicht</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">
            Willkommen zurück, {user.displayName.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Aktivität bei {user.tenantName}.</p>
        </div>
        <Button asChild className="gap-1.5">
          <Link to="/submit"><Plus size={16} strokeWidth={2} /> Idee einreichen</Link>
        </Button>
      </header>

      {/* Status breakdowns: my ideas by status + all ideas by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="eyebrow">Meine Ideen nach Status</div>
            {!ideasQ.isLoading && <span className="text-[11px] text-muted-foreground tabular-nums">{myIdeas.length}</span>}
          </div>
          {ideasQ.isLoading
            ? <div className="space-y-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            : <StatusBreakdown list={myIdeas} mineOf={user.id} empty="Sie haben noch keine Ideen eingereicht." />}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="eyebrow">Alle Ideen nach Status</div>
            {!ideasQ.isLoading && <span className="text-[11px] text-muted-foreground tabular-nums">{ideas.length}</span>}
          </div>
          {ideasQ.isLoading
            ? <div className="space-y-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            : <StatusBreakdown list={ideas} empty="Noch keine Ideen vorhanden." />}
        </Card>
      </div>

      {/* Personal sections: my ideas + my comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="eyebrow">Meine Ideen</div>
            {!ideasQ.isLoading && <span className="text-[11px] text-muted-foreground tabular-nums">{myIdeas.length}</span>}
          </div>
          {ideasQ.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
          ) : myIdeas.length === 0 ? (
            <div className="rounded border border-dashed border-border py-8 text-center">
              <Lightbulb className="mx-auto text-muted-foreground/50" size={22} strokeWidth={1.5} />
              <div className="mt-2 text-[13px] font-medium text-foreground">Noch keine eigenen Ideen</div>
              <p className="mt-1 text-[12px] text-muted-foreground">Teilen Sie Ihren ersten Vorschlag mit dem Team.</p>
              <Button asChild size="sm" className="mt-3 gap-1.5"><Link to="/submit"><Plus size={14} /> Idee einreichen</Link></Button>
            </div>
          ) : (
            <>
              <ul className="space-y-0.5">
                {myIdeas.slice(0, 6).map((i) => (
                  <li key={i.id}>
                    <Link to={`/ideas/${i.id}`} className="flex items-center gap-2 rounded px-2 py-2 -mx-2 hover:bg-accent transition-colors">
                      <span className="flex-1 min-w-0 text-[13px] font-medium text-foreground truncate tracking-tight">{i.title}</span>
                      <StageBadge stage={i.stage} />
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums shrink-0"><ArrowBigUp size={13} />{i.netVotes}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {myIdeas.length > 6 && (
                <Link to="/ideas" className="mt-2 inline-block text-[12px] text-primary hover:underline">Alle {myIdeas.length} ansehen →</Link>
              )}
            </>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="eyebrow">Meine Kommentare</div>
            {!commentsLoading && <span className="text-[11px] text-muted-foreground tabular-nums">{myComments.length}</span>}
          </div>
          {commentsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
          ) : myComments.length === 0 ? (
            <div className="rounded border border-dashed border-border py-8 text-center">
              <MessageSquare className="mx-auto text-muted-foreground/50" size={20} strokeWidth={1.5} />
              <div className="mt-2 text-[13px] font-medium text-foreground">Noch keine Kommentare</div>
              <p className="mt-1 text-[12px] text-muted-foreground">Diskutieren Sie Ideen, um sie voranzubringen.</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {myComments.slice(0, 6).map(({ comment, idea }) => (
                <li key={comment.id}>
                  <Link to={`/ideas/${idea.id}`} className="block rounded px-2 py-2 -mx-2 hover:bg-accent transition-colors">
                    <div className="text-[13px] text-foreground line-clamp-2 leading-snug">{comment.body}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="truncate">zu „{idea.title}“</span>
                      <span className="shrink-0">· {fmtDate(comment.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section>
        <div className="eyebrow mb-3">Diese Woche im Trend</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ideasQ.isLoading
            ? Array.from({ length: 3 }, (_, i) => <IdeaCardSkeleton key={i} />)
            : trending.length === 0
              ? <div className="text-sm text-muted-foreground">Noch nichts unterwegs — reichen Sie die erste Idee ein.</div>
              : trending.map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>

      <section>
        <div className="eyebrow mb-3">Letzte Aktivität</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ideasQ.isLoading
            ? Array.from({ length: 4 }, (_, i) => <IdeaCardSkeleton key={i} />)
            : ideas.slice(0, 6).map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>
    </div>
  )
}

function StatusBreakdown({ list, mineOf, empty }: { list: Idea[]; mineOf?: string; empty: string }) {
  void mineOf // list is already pre-filtered by the caller; kept for call-site clarity
  if (list.length === 0) {
    return <div className="py-6 text-center text-[12px] text-muted-foreground">{empty}</div>
  }
  const counts = countByStage(list)
  const total = list.length
  const present = STATUS_ORDER.filter((s) => (counts[s] ?? 0) > 0)
  return (
    <ul className="space-y-2">
      {present.map((stage) => {
        const n = counts[stage] ?? 0
        const pct = Math.round((n / total) * 100)
        return (
          <li key={stage} className="flex items-center gap-3">
            <div className="w-32 shrink-0"><StageBadge stage={stage} /></div>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-foreground/70" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-7 text-right text-[12px] font-medium text-foreground tabular-nums shrink-0">{n}</span>
            <span className="w-9 text-right text-[11px] text-muted-foreground tabular-nums shrink-0">{pct}%</span>
          </li>
        )
      })}
    </ul>
  )
}

