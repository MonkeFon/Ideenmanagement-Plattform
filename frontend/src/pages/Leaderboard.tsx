import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { LeaderboardApi } from '@/api/endpoints'
import StageBadge from '@/components/StageBadge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Users, ArrowUp, MessageSquare } from 'lucide-react'

const ROLE_LABEL_DE: Record<string, string> = {
  EMPLOYEE: 'Mitarbeiter',
  REVIEWER: 'Prüfer',
  IDEA_MANAGER: 'Ideenmanager',
  SPONSOR: 'Sponsor',
  ADMIN: 'Administrator',
  SUPERADMIN: 'Super-Administrator',
}

export default function Leaderboard() {
  const q = useQuery({ queryKey: ['leaderboard'], queryFn: () => LeaderboardApi.get() })

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl mx-auto">
      <header>
        <div className="eyebrow">Rangliste</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Rangliste</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Top-Ideen nach Priorität und Netto-Stimmen; Top-Beitragende gewichtet aus Einreichungen, erhaltenen Stimmen, Kommentaren und Bewertungen.
        </p>
      </header>

      {q.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((c) => (
            <Card key={c} className="p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 5 }, (_, r) => (
                <div key={r} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-6 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-2.5 w-2/5" />
                  </div>
                  <Skeleton className="h-3 w-10 shrink-0" />
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
      {q.error && <div className="text-[13px] text-destructive">Rangliste konnte nicht geladen werden.</div>}

      {q.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <header className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Trophy size={14} strokeWidth={1.75} className="text-muted-foreground" />
              <div className="eyebrow">Top-Ideen</div>
              <span className="ml-auto text-[11px] text-muted-foreground/70 tabular-nums font-mono">
                {q.data.topIdeas.length}
              </span>
            </header>
            <ol className="divide-y divide-border">
              {q.data.topIdeas.length === 0 && (
                <li className="px-4 py-6 text-[13px] text-muted-foreground">Noch keine bewerteten Ideen.</li>
              )}
              {q.data.topIdeas.map((i) => (
                <li key={i.id}>
                  <Link
                    to={`/ideas/${i.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <span className={`font-mono tabular-nums text-[12px] w-6 pt-0.5 ${
                      i.rank === 1 ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                      i.rank === 2 ? 'text-muted-foreground font-semibold' :
                      i.rank === 3 ? 'text-orange-700 dark:text-orange-400 font-semibold' :
                      'text-muted-foreground/70'
                    }`}>{i.rank.toString().padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-foreground tracking-tight truncate">{i.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <StageBadge stage={i.stage} />
                        <span>{i.authorName}</span>
                        {i.category && <span className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground/70">{i.category}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      {i.priorityScore != null && (
                        <div className="font-mono text-[13px] text-foreground" title="Prioritätswert">{i.priorityScore.toFixed(2)}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 justify-end mt-0.5">
                        <span className="inline-flex items-center gap-1"><ArrowUp size={11} strokeWidth={2} />{i.netVotes}</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare size={11} strokeWidth={2} />{i.commentCount}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <header className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Users size={14} strokeWidth={1.75} className="text-muted-foreground" />
              <div className="eyebrow">Top-Beitragende</div>
              <span className="ml-auto text-[11px] text-muted-foreground/70 tabular-nums font-mono">
                {q.data.topContributors.length}
              </span>
            </header>
            <ol className="divide-y divide-border">
              {q.data.topContributors.length === 0 && (
                <li className="px-4 py-6 text-[13px] text-muted-foreground">Noch keine Beitragenden.</li>
              )}
              {q.data.topContributors.map((c) => (
                <li key={c.userId} className="flex items-start gap-3 px-4 py-3">
                  <span className={`font-mono tabular-nums text-[12px] w-6 pt-0.5 ${
                    c.rank === 1 ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                    c.rank === 2 ? 'text-muted-foreground font-semibold' :
                    c.rank === 3 ? 'text-orange-700 dark:text-orange-400 font-semibold' :
                    'text-muted-foreground/70'
                  }`}>{c.rank.toString().padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground tracking-tight truncate">
                      {c.displayName}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                      {ROLE_LABEL_DE[c.role] ?? c.role}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                      <span><span className="text-foreground font-medium">{c.ideasSubmitted}</span> Ideen</span>
                      <span><span className="text-foreground font-medium">+{c.votesReceived}</span> Stimmen</span>
                      <span><span className="text-foreground font-medium">{c.commentsPosted}</span> Kommentare</span>
                      <span><span className="text-foreground font-medium">{c.evaluationsGiven}</span> Bewertungen</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono tabular-nums text-[13px] text-foreground">{c.score}</div>
                    <div className="eyebrow text-[10px] mt-0.5">Punkte</div>
                  </div>
                </li>
              ))}
            </ol>
            <footer className="px-4 py-2 border-t border-border text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider">
Punkte = 5·Ideen + Stimmen + Kommentare + 2·Bewertungen
            </footer>
          </Card>
        </div>
      )}
    </div>
  )
}
