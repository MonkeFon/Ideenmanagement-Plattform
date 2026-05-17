import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { LeaderboardApi } from '@/api/endpoints'
import StageBadge from '@/components/StageBadge'
import Spinner from '@/components/Spinner'
import { Trophy, Users, ArrowUp, MessageSquare } from 'lucide-react'

const ROLE_LABEL_DE: Record<string, string> = {
  EMPLOYEE: 'Mitarbeiter',
  REVIEWER: 'Prüfer',
  INNOVATION_MANAGER: 'Innovationsmanager',
  SPONSOR: 'Sponsor',
  ADMIN: 'Administrator',
  SUPERADMIN: 'Super-Administrator',
}

export default function Leaderboard() {
  const q = useQuery({ queryKey: ['leaderboard'], queryFn: () => LeaderboardApi.get() })

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <header>
        <div className="eyebrow">Rangliste</div>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Rangliste</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
          Top-Ideen nach Priorität und Netto-Stimmen; Top-Beitragende gewichtet aus Einreichungen, erhaltenen Stimmen, Kommentaren und Bewertungen.
        </p>
      </header>

      {q.isLoading && <Spinner label="Wird geladen…" />}
      {q.error && <div className="text-[13px] text-rose-600 dark:text-rose-400">Rangliste konnte nicht geladen werden.</div>}

      {q.data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="card">
            <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Trophy size={14} strokeWidth={1.75} className="text-slate-500 dark:text-slate-400" />
              <div className="eyebrow">Top-Ideen</div>
              <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500 tabular-nums font-mono">
                {q.data.topIdeas.length}
              </span>
            </header>
            <ol className="divide-y divide-slate-200 dark:divide-slate-800">
              {q.data.topIdeas.length === 0 && (
                <li className="px-4 py-6 text-[13px] text-slate-500 dark:text-slate-400">Noch keine bewerteten Ideen.</li>
              )}
              {q.data.topIdeas.map((i) => (
                <li key={i.id}>
                  <Link
                    to={`/ideas/${i.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <span className={`font-mono tabular-nums text-[12px] w-6 pt-0.5 ${
                      i.rank === 1 ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                      i.rank === 2 ? 'text-slate-500 dark:text-slate-400 font-semibold' :
                      i.rank === 3 ? 'text-orange-700 dark:text-orange-400 font-semibold' :
                      'text-slate-400 dark:text-slate-500'
                    }`}>{i.rank.toString().padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 tracking-tight truncate">{i.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <StageBadge stage={i.stage} />
                        <span>{i.authorName}</span>
                        {i.category && <span className="font-mono uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500">{i.category}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      {i.priorityScore != null && (
                        <div className="font-mono text-[13px] text-slate-900 dark:text-slate-100" title="Prioritäts-Score">{i.priorityScore.toFixed(2)}</div>
                      )}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 justify-end mt-0.5">
                        <span className="inline-flex items-center gap-1"><ArrowUp size={11} strokeWidth={2} />{i.netVotes}</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare size={11} strokeWidth={2} />{i.commentCount}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="card">
            <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Users size={14} strokeWidth={1.75} className="text-slate-500 dark:text-slate-400" />
              <div className="eyebrow">Top-Beitragende</div>
              <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500 tabular-nums font-mono">
                {q.data.topContributors.length}
              </span>
            </header>
            <ol className="divide-y divide-slate-200 dark:divide-slate-800">
              {q.data.topContributors.length === 0 && (
                <li className="px-4 py-6 text-[13px] text-slate-500 dark:text-slate-400">Noch keine Beitragenden.</li>
              )}
              {q.data.topContributors.map((c) => (
                <li key={c.userId} className="flex items-start gap-3 px-4 py-3">
                  <span className={`font-mono tabular-nums text-[12px] w-6 pt-0.5 ${
                    c.rank === 1 ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                    c.rank === 2 ? 'text-slate-500 dark:text-slate-400 font-semibold' :
                    c.rank === 3 ? 'text-orange-700 dark:text-orange-400 font-semibold' :
                    'text-slate-400 dark:text-slate-500'
                  }`}>{c.rank.toString().padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 tracking-tight truncate">
                      {c.displayName}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
                      {ROLE_LABEL_DE[c.role] ?? c.role}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <span><span className="text-slate-900 dark:text-slate-100 font-medium">{c.ideasSubmitted}</span> Ideen</span>
                      <span><span className="text-slate-900 dark:text-slate-100 font-medium">+{c.votesReceived}</span> Stimmen</span>
                      <span><span className="text-slate-900 dark:text-slate-100 font-medium">{c.commentsPosted}</span> Kommentare</span>
                      <span><span className="text-slate-900 dark:text-slate-100 font-medium">{c.evaluationsGiven}</span> Bewertungen</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums text-[13px] text-slate-900 dark:text-slate-100">{c.score}</div>
                    <div className="eyebrow text-[10px] mt-0.5">Score</div>
                  </div>
                </li>
              ))}
            </ol>
            <footer className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">
              Score = 5·Ideen + Stimmen + Kommentare + 2·Bewertungen
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
