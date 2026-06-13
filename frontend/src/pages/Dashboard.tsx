import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { IdeaApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import IdeaCardSkeleton from '@/components/IdeaCardSkeleton'
import StageBadge from '@/components/StageBadge'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/store/auth'
import {
  Plus, ArrowBigUp, MessageSquare, Lightbulb, Sparkles,
  ArrowUp, ArrowDown, ChevronsUpDown,
} from 'lucide-react'
import type { Comment, Idea, Stage } from '@/types/api'

function fmtDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateShort(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}

// Pipeline order — drives the status-chip ordering and makes the status column
// sort by workflow position instead of alphabetically.
const STAGE_ORDER: Stage[] = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION',
  'APPROVED', 'IN_IMPLEMENTATION', 'DONE', 'REJECTED', 'ARCHIVED',
]
const stageRank = (s: Stage) => {
  const i = STAGE_ORDER.indexOf(s)
  return i === -1 ? 99 : i
}

type SortKey = 'title' | 'stage' | 'netVotes' | 'commentCount' | 'createdAt'
type SortDir = 'asc' | 'desc'

export default function Dashboard() {
  const user = useAuth((s) => s.user)!
  const navigate = useNavigate()
  const ideasQ = useQuery({ queryKey: ['ideas'], queryFn: () => IdeaApi.list() })
  const ideas: Idea[] = useMemo(() => ideasQ.data ?? [], [ideasQ.data])

  // "Diese Woche im Trend": the most up-voted ideas still in the open pipeline.
  const open = ideas.filter((i) => ['SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION'].includes(i.stage))
  const trending = [...open].sort((a, b) => b.netVotes - a.netVotes).slice(0, 3)

  // Meine Ideen — filter the already-loaded tenant list by author (no extra request).
  const myIdeas = useMemo(
    () => ideas.filter((i) => i.authorId === user.id),
    [ideas, user.id],
  )

  // Status counts for the chips inside the Meine-Ideen card (former "nach Status" card).
  const myStatusCounts = useMemo(() => {
    const m = new Map<Stage, number>()
    for (const i of myIdeas) m.set(i.stage, (m.get(i.stage) ?? 0) + 1)
    return STAGE_ORDER.filter((s) => m.has(s)).map((s) => [s, m.get(s)!] as const)
  }, [myIdeas])

  // Sortable table state. Defaults to newest first.
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' })

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      // Text sorts ascending by default; numbers/dates/status descending feels wrong
      // for status (pipeline order reads top-down), so stage also starts ascending.
      return { key, dir: key === 'title' || key === 'stage' ? 'asc' : 'desc' }
    })
  }

  const myRows = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1
    const cmp = (a: Idea, b: Idea): number => {
      switch (sort.key) {
        case 'title':        return a.title.localeCompare(b.title, 'de')
        case 'stage':        return stageRank(a.stage) - stageRank(b.stage)
        case 'netVotes':     return a.netVotes - b.netVotes
        case 'commentCount': return a.commentCount - b.commentCount
        case 'createdAt':    return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0)
        default:             return 0
      }
    }
    return [...myIdeas].sort((a, b) => dir * cmp(a, b))
  }, [myIdeas, sort])

  function SortHeader({ k, label, className }: { k: SortKey; label: string; className?: string }) {
    const active = sort.key === k
    return (
      <th
        className={cn('px-3 py-2 font-medium text-muted-foreground select-none', className)}
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={cn('inline-flex items-center gap-1 hover:text-foreground transition-colors', active && 'text-foreground')}
        >
          {label}
          {active
            ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
            : <ChevronsUpDown size={12} className="opacity-40" />}
        </button>
      </th>
    )
  }

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

      {/* Meine Ideen — sortable table with the per-status summary folded in as chips */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="eyebrow">Meine Ideen</div>
          {!ideasQ.isLoading && <span className="text-[11px] text-muted-foreground tabular-nums">{myIdeas.length}</span>}
        </div>

        {ideasQ.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : myIdeas.length === 0 ? (
          <div className="rounded border border-dashed border-border py-8 text-center">
            <Lightbulb className="mx-auto text-muted-foreground/50" size={22} strokeWidth={1.5} />
            <div className="mt-2 text-[13px] font-medium text-foreground">Noch keine eigenen Ideen</div>
            <p className="mt-1 text-[12px] text-muted-foreground">Teilen Sie Ihren ersten Vorschlag mit dem Team.</p>
            <Button asChild size="sm" className="mt-3 gap-1.5"><Link to="/submit"><Plus size={14} /> Idee einreichen</Link></Button>
          </div>
        ) : (
          <>
            {/* Status summary (former "Meine Ideen nach Status" card) */}
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {myStatusCounts.map(([stage, n]) => (
                <span key={stage} className="inline-flex items-center gap-1.5">
                  <StageBadge stage={stage} />
                  <span className="text-[12px] font-medium text-foreground tabular-nums">{n}</span>
                </span>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-[12px]">
                    <SortHeader k="title" label="Titel" />
                    <SortHeader k="stage" label="Status" />
                    <SortHeader k="netVotes" label="Stimmen" className="text-right" />
                    <SortHeader k="commentCount" label="Kommentare" className="hidden md:table-cell text-right" />
                    <SortHeader k="createdAt" label="Erstellt" className="text-right whitespace-nowrap" />
                  </tr>
                </thead>
                <tbody>
                  {myRows.map((i) => (
                    <tr
                      key={i.id}
                      onClick={() => navigate(`/ideas/${i.id}`)}
                      className="border-b border-border/60 last:border-0 cursor-pointer hover:bg-accent/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 max-w-[28rem]">
                        <div className="flex items-center gap-2">
                          {i.campaignName && (
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: i.campaignColor ?? '#888' }}
                              title={i.campaignName}
                            />
                          )}
                          <Link
                            to={`/ideas/${i.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-foreground tracking-tight hover:underline truncate"
                          >
                            {i.title}
                          </Link>
                          {i.sponsorBoost && <Sparkles size={13} className="text-amber-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><StageBadge stage={i.stage} /></td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <span className="inline-flex items-center gap-1 text-foreground"><ArrowBigUp size={14} className="text-muted-foreground" />{i.netVotes}</span>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell text-right tabular-nums text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MessageSquare size={12} />{i.commentCount}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(i.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Meine Kommentare */}
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
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
            {myComments.slice(0, 6).map(({ comment, idea }) => (
              <li key={comment.id}>
                <Link to={`/ideas/${idea.id}`} className="block rounded px-2 py-2 -mx-2 hover:bg-accent transition-colors">
                  <div className="text-[13px] text-foreground line-clamp-2 leading-snug">{comment.body}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="truncate">zu „{idea.title}“</span>
                    <span className="shrink-0">· {fmtDateShort(comment.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

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
