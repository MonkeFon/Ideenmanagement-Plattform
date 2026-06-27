import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { IdeaApi, SearchApi } from '@/api/endpoints'
import StageBadge, { stageLabels } from '@/components/StageBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  Search, Sparkles, ArrowUp, ArrowDown, ChevronsUpDown,
  MessageSquare, ArrowBigUp, X,
} from 'lucide-react'
import type { Idea, Stage } from '@/types/api'

// Pipeline order — used both for the status dropdown ordering and for sorting the
// status column meaningfully (instead of alphabetically).
const STAGE_ORDER: Stage[] = [
  'SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION',
  'APPROVED', 'IN_IMPLEMENTATION', 'DONE', 'REJECTED', 'ARCHIVED',
]
const stageRank = (s: Stage) => {
  const i = STAGE_ORDER.indexOf(s)
  return i === -1 ? 99 : i
}

const TIME_RANGES = [
  { value: 'all', label: 'Zeitraum', days: null },
  { value: '1',   label: 'Letzte 24 Stunden', days: 1 },
  { value: '7',   label: 'Letzte 7 Tage', days: 7 },
  { value: '30',  label: 'Letzte 30 Tage', days: 30 },
  { value: '90',  label: 'Letzte 90 Tage', days: 90 },
  { value: '365', label: 'Letztes Jahr', days: 365 },
] as const

type SortKey = 'title' | 'stage' | 'category' | 'netVotes' | 'commentCount' | 'priorityScore' | 'author' | 'createdAt' | 'similarity'
type SortDir = 'asc' | 'desc'

const SELECT_CLASS =
  'h-9 rounded border border-input bg-background px-2.5 text-sm text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

function fmtDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function IdeaList() {
  const navigate = useNavigate()

  const ideasQ = useQuery({ queryKey: ['ideas'], queryFn: () => IdeaApi.list() })
  const ideas = useMemo(() => ideasQ.data ?? [], [ideasQ.data])

  // Filters
  const [text, setText] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')

  // Semantic search overlay: id -> similarity. When set, the table is restricted
  // to these ideas and a similarity column appears.
  const [semantic, setSemantic] = useState<Map<string, number> | null>(null)
  const [semanticQuery, setSemanticQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' })

  // Distinct values present in the data, for the dropdowns.
  const statusOptions = useMemo(() => {
    const present = new Set(ideas.map((i) => i.stage))
    return STAGE_ORDER.filter((s) => present.has(s))
  }, [ideas])
  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    ideas.forEach((i) => { if (i.category) set.add(i.category) })
    return [...set].sort((a, b) => a.localeCompare(b, 'de'))
  }, [ideas])

  async function runSemantic(e: React.FormEvent) {
    e.preventDefault()
    const q = text.trim()
    if (!q) { setSemantic(null); setSemanticQuery(''); return }
    setSearching(true)
    try {
      const hits = await SearchApi.semantic(q)
      setSemantic(new Map(hits.map((h) => [h.id, h.similarity])))
      setSemanticQuery(q)
      setSort({ key: 'similarity', dir: 'desc' })
    } finally {
      setSearching(false)
    }
  }

  function clearSemantic() {
    setSemantic(null)
    setSemanticQuery('')
    // The text box held the semantic query — clear it so the browse list returns
    // instead of the query lingering as a (usually zero-match) substring filter.
    setText('')
    setSort({ key: 'createdAt', dir: 'desc' })
  }

  function resetAll() {
    setText(''); setStatus('all'); setTimeRange('all'); setCategory('all')
    clearSemantic()
  }

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      // Text sorts ascending by default; numbers/dates/similarity descending.
      return { key, dir: key === 'title' || key === 'category' || key === 'author' ? 'asc' : 'desc' }
    })
  }

  const rows = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.value === timeRange)
    const cutoff = range?.days != null ? Date.now() - range.days * 86_400_000 : null
    const q = text.trim().toLowerCase()

    const base = semantic ? ideas.filter((i) => semantic.has(i.id)) : ideas

    const filtered = base.filter((i) => {
      if (status !== 'all' && i.stage !== status) return false
      if (category !== 'all' && (i.category ?? '') !== category) return false
      if (cutoff != null) {
        const t = Date.parse(i.createdAt)
        if (!isNaN(t) && t < cutoff) return false
      }
      // Substring filter applies only in browse mode. While a semantic search is
      // active the text box holds the *concept query* (already resolved to the
      // `semantic` id set), so re-applying it literally would wrongly drop hits
      // whose title doesn't contain the exact words.
      if (q && !semantic) {
        const hay = `${i.title} ${i.authorName} ${i.category ?? ''} ${i.campaignName ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    const dir = sort.dir === 'asc' ? 1 : -1
    const cmp = (a: Idea, b: Idea): number => {
      switch (sort.key) {
        case 'title':         return a.title.localeCompare(b.title, 'de')
        case 'stage':         return stageRank(a.stage) - stageRank(b.stage)
        case 'category':      return (a.category ?? '').localeCompare(b.category ?? '', 'de')
        case 'netVotes':      return a.netVotes - b.netVotes
        case 'commentCount':  return a.commentCount - b.commentCount
        case 'priorityScore': return (a.priorityScore ?? -Infinity) - (b.priorityScore ?? -Infinity)
        case 'author':        return a.authorName.localeCompare(b.authorName, 'de')
        case 'createdAt':     return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0)
        case 'similarity':    return (semantic?.get(a.id) ?? 0) - (semantic?.get(b.id) ?? 0)
        default:              return 0
      }
    }
    return [...filtered].sort((a, b) => dir * cmp(a, b))
  }, [ideas, semantic, status, category, timeRange, text, sort])

  const anyFilterActive = text.trim() !== '' || status !== 'all' || timeRange !== 'all' || category !== 'all' || semantic !== null

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

  const COLSPAN = semantic ? 9 : 8

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Ideen</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Ideenübersicht</h1>
        </div>
        <Button asChild><Link to="/submit">Idee einreichen</Link></Button>
      </header>

      {/* Filter toolbar */}
      <Card asChild>
        <form onSubmit={runSemantic} className="p-2.5 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[14rem]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={15} strokeWidth={1.75} />
            <Input
              className="pl-8"
              placeholder="Begriff für semantische Suche eingeben"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <select className={SELECT_CLASS} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filtern">
            <option value="all">Status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{stageLabels[s]}</option>)}
          </select>

          <select className={SELECT_CLASS} value={timeRange} onChange={(e) => setTimeRange(e.target.value)} aria-label="Zeitraum filtern">
            {TIME_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          <select className={SELECT_CLASS} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Kategorie filtern">
            <option value="all">Kategorien</option>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <Button type="submit" variant="secondary" disabled={searching} title="Findet Ideen nach Bedeutung (Vektor-Ähnlichkeit), nicht nur nach Stichwort">
            {searching ? 'Suche…' : 'Suche'}
          </Button>

          {anyFilterActive && (
            <Button type="button" variant="ghost" size="sm" onClick={resetAll}>Zurücksetzen</Button>
          )}
        </form>
      </Card>

      {/* Counter + active semantic chip */}
      <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
        <span className="tabular-nums">{rows.length} von {ideas.length} Ideen</span>
        {semanticQuery && (
          <button
            type="button"
            onClick={clearSemantic}
            className="inline-flex items-center gap-1.5 rounded-full border border-input bg-accent/60 px-2.5 py-1 text-[12px] text-foreground hover:border-ring transition-colors"
            title="Semantische Suche aufheben"
          >
            <Sparkles size={12} className="text-amber-500" />
            Suche: „{semanticQuery}“
            <X size={12} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Table — overflow-clip (not -auto) so the sticky thead can pin against the page scroll */}
      <div className="rounded-lg border border-border overflow-clip">
        <table className="w-full text-sm border-collapse">
          {/* Sticky below the h-14 app bar; opaque bg + hairline shadow stand in for the
              border-b, which would scroll away under border-collapse. */}
          <thead className="sticky top-14 z-10 bg-background shadow-[0_1px_0_0_rgb(var(--border))]">
            <tr className="bg-muted/40 text-left text-[12px]">
              <SortHeader k="title" label="Titel" />
              <SortHeader k="stage" label="Status" />
              <SortHeader k="category" label="Kategorie" className="hidden md:table-cell" />
              <SortHeader k="netVotes" label="Stimmen" className="text-right" />
              <SortHeader k="commentCount" label="Kommentare" className="hidden md:table-cell text-right" />
              <SortHeader k="priorityScore" label="Priorität" className="hidden lg:table-cell text-right" />
              {semantic && <SortHeader k="similarity" label="Ähnlichkeit" className="text-right" />}
              <SortHeader k="author" label="Autor" className="hidden md:table-cell" />
              <SortHeader k="createdAt" label="Erstellt" className="text-right whitespace-nowrap" />
            </tr>
          </thead>
          <tbody>
            {ideasQ.isLoading && Array.from({ length: 8 }, (_, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="px-3 py-2.5" colSpan={COLSPAN}><Skeleton className="h-5 w-full" /></td>
              </tr>
            ))}

            {!ideasQ.isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={COLSPAN} className="px-3 py-12 text-center">
                  <Search className="mx-auto text-muted-foreground/50" size={22} strokeWidth={1.5} />
                  <div className="mt-2 text-[13px] font-medium text-foreground">Keine Ideen gefunden</div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {anyFilterActive ? 'Passen Sie die Filter an oder setzen Sie sie zurück.' : 'Es sind noch keine Ideen vorhanden.'}
                  </p>
                </td>
              </tr>
            )}

            {!ideasQ.isLoading && rows.map((i) => (
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
                <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">{i.category ?? '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className="inline-flex items-center gap-1 text-foreground"><ArrowBigUp size={14} className="text-muted-foreground" />{i.netVotes}</span>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell text-right tabular-nums text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MessageSquare size={12} />{i.commentCount}</span>
                </td>
                <td className="px-3 py-2.5 hidden lg:table-cell text-right tabular-nums text-muted-foreground">
                  {i.priorityScore != null ? i.priorityScore.toFixed(2) : '—'}
                </td>
                {semantic && (
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium text-foreground">
                    {((semantic.get(i.id) ?? 0) * 100).toFixed(0)}%
                  </td>
                )}
                <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground truncate max-w-[10rem]">{i.authorName}</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground whitespace-nowrap tabular-nums">{fmtDate(i.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
