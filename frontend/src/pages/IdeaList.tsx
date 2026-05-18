import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IdeaApi, SearchApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import StageBadge, { stageLabels } from '@/components/StageBadge'
import Spinner from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import type { Stage, SimilarIdea } from '@/types/api'
import { Link } from 'react-router-dom'

const FILTER_STAGES: Stage[] = ['SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZATION', 'APPROVED', 'IN_IMPLEMENTATION', 'DONE']

export default function IdeaList() {
  const [stage, setStage] = useState<Stage | undefined>()
  const [query, setQuery] = useState('')
  const [semantic, setSemantic] = useState<SimilarIdea[] | null>(null)

  const ideasQ = useQuery({
    queryKey: ['ideas', stage],
    queryFn: () => IdeaApi.list(stage),
  })

  async function runSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) { setSemantic(null); return }
    const hits = await SearchApi.semantic(query)
    setSemantic(hits)
  }

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Ideen</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Alle Ideen</h1>
        </div>
        <Button asChild><Link to="/submit">Idee einreichen</Link></Button>
      </header>

      <Card asChild>
        <form onSubmit={runSearch} className="p-2 flex flex-wrap items-center gap-2">
          <Search className="text-muted-foreground/70 hidden sm:block ml-1" size={15} strokeWidth={1.75} />
          <Input
            className="flex-1 min-w-[12rem] border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 bg-transparent"
            placeholder="Semantisch suchen — beschreiben Sie ein Konzept, nicht nur Stichworte…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="secondary" type="submit">Suchen</Button>
          {semantic && (
            <Button variant="ghost" size="sm" type="button" onClick={() => { setSemantic(null); setQuery('') }}>
              Zurücksetzen
            </Button>
          )}
        </form>
      </Card>

      {semantic && (
        <section>
          <div className="eyebrow mb-3">Semantische Treffer</div>
          {semantic.length === 0 && <Card className="p-5 text-[13px] text-muted-foreground">Keine ähnlichen Ideen gefunden.</Card>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {semantic.map((s) => (
              <Card key={s.id} asChild className="p-4 transition-colors hover:border-input">
                <Link to={`/ideas/${s.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-foreground text-[14px] tracking-tight">{s.title}</h3>
                    <span className="font-mono text-[11px] text-foreground tabular-nums">{(s.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">{s.snippet}</p>
                  <div className="mt-2"><StageBadge stage={s.stage} /></div>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant={!stage ? 'default' : 'outline'} onClick={() => setStage(undefined)}>
          Alle
        </Button>
        {FILTER_STAGES.map((s) => (
          <Button key={s} size="sm" variant={stage === s ? 'default' : 'outline'} onClick={() => setStage(s)}>
            {stageLabels[s]}
          </Button>
        ))}
      </div>

      <section>
        {ideasQ.isLoading && <Spinner label="Wird geladen…" />}
        {ideasQ.data && ideasQ.data.length === 0 && (
          <Card className="p-8 text-center text-[13px] text-muted-foreground">Noch keine Ideen in diesem Status.</Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ideasQ.data?.map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>
    </div>
  )
}
