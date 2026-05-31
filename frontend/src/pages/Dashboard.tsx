import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { IdeaApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import IdeaCardSkeleton from '@/components/IdeaCardSkeleton'
import StageBadge from '@/components/StageBadge'
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

export default function Dashboard() {
  const user = useAuth((s) => s.user)!
  const ideasQ = useQuery({ queryKey: ['ideas'], queryFn: () => IdeaApi.list() })
  const ideas: Idea[] = ideasQ.data ?? []

  const byStage = (...s: Stage[]) => ideas.filter((i) => s.includes(i.stage))
  const open = byStage('SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION')
  const inFlight = byStage('APPROVED', 'IN_IMPLEMENTATION')
  const done = byStage('DONE')
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

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border border-border rounded">
        {ideasQ.isLoading
          ? (<><StatSkeleton /><StatSkeleton /><StatSkeleton /></>)
          : (<><Stat label="Offen" value={open.length} /><Stat label="In Umsetzung" value={inFlight.length} /><Stat label="Erledigt" value={done.length} /></>)}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-5 py-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground tabular-nums tracking-tight">{value}</div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="px-5 py-4 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-12" />
    </div>
  )
}
