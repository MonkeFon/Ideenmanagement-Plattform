import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IdeaApi, SearchApi } from '@/api/endpoints'
import IdeaCard from '@/components/IdeaCard'
import StageBadge, { stageLabels } from '@/components/StageBadge'
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
    <div className="p-4 md:p-8 space-y-6 max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">All ideas</h1>
          <p className="text-slate-500 mt-1">Browse, filter, or search semantically.</p>
        </div>
        <Link to="/submit" className="btn-primary">+ Submit an idea</Link>
      </header>

      <form onSubmit={runSearch} className="card p-3 md:p-4 flex flex-wrap items-center gap-2 md:gap-3">
        <Search className="text-slate-400 hidden sm:block" size={18} />
        <input
          className="input flex-1 min-w-[12rem] border-none focus:ring-0 px-0"
          placeholder="Semantic search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-secondary" type="submit">Search</button>
        {semantic && (
          <button className="btn-ghost" type="button" onClick={() => { setSemantic(null); setQuery('') }}>
            Clear
          </button>
        )}
      </form>

      {semantic && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Semantic matches
          </h2>
          {semantic.length === 0 && <div className="card p-6 text-sm text-slate-500">No similar ideas found.</div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {semantic.map((s) => (
              <Link key={s.id} to={`/ideas/${s.id}`} className="card p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <span className="badge-blue">{(s.similarity * 100).toFixed(0)}%</span>
                </div>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{s.snippet}</p>
                <div className="mt-2"><StageBadge stage={s.stage} /></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`badge ${!stage ? 'badge-blue' : 'badge-gray'}`}
          onClick={() => setStage(undefined)}
        >
          All
        </button>
        {FILTER_STAGES.map((s) => (
          <button
            key={s}
            className={`badge ${stage === s ? 'badge-blue' : 'badge-gray'}`}
            onClick={() => setStage(s)}
          >
            {stageLabels[s]}
          </button>
        ))}
      </div>

      <section>
        {ideasQ.isLoading && <div className="text-sm text-slate-500">Loading…</div>}
        {ideasQ.data && ideasQ.data.length === 0 && (
          <div className="card p-8 text-center text-slate-500">No ideas in this stage yet.</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ideasQ.data?.map((i) => <IdeaCard key={i.id} idea={i} />)}
        </div>
      </section>
    </div>
  )
}
