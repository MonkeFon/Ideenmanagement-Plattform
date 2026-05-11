import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { votesApi } from '@/api/votes';
import { QK } from '@/lib/queryClient';
import { usePermissions } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/lib/permissions';
import type { VoteSummaryResponse, VoteType } from '@/types/api';
import { cn } from '@/lib/utils';

export function VoteButtons({ ideaId, summary }: { ideaId: string; summary?: VoteSummaryResponse }) {
  const qc = useQueryClient();
  const { hasPermission } = usePermissions();
  const canVote = hasPermission(PERMISSIONS.VotesCast);
  const key = QK.voteSummary(ideaId);

  // Cache mit Prop seeden, damit optimistic Updates korrekt greifen.
  useEffect(() => {
    if (summary && qc.getQueryData(key) === undefined) {
      qc.setQueryData(key, summary);
    }
  }, [summary, qc, key]);

  // Live-Wert aus Cache lesen (Fallback: Prop). Sorgt dafür, dass
  // optimistic Updates sofort sichtbar werden.
  const live = useQuery<VoteSummaryResponse | undefined>({
    queryKey: key,
    queryFn: () => votesApi.summary(ideaId),
    enabled: false, // wir refetchen nur über invalidateQueries
    initialData: summary,
  });
  const current = live.data ?? summary;

  const mutation = useMutation({
    mutationFn: async (type: VoteType | null) => {
      if (type === null) return votesApi.remove(ideaId);
      return votesApi.cast(ideaId, { voteType: type });
    },
    onMutate: async (type) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<VoteSummaryResponse>(key) ?? summary;
      if (prev) {
        const next: VoteSummaryResponse = { ...prev };
        if (prev.currentUserVote === 'Up') next.up = Math.max(0, next.up - 1);
        if (prev.currentUserVote === 'Down') next.down = Math.max(0, next.down - 1);
        if (type === 'Up') next.up += 1;
        if (type === 'Down') next.down += 1;
        next.currentUserVote = type;
        next.score = next.up - next.down;
        qc.setQueryData(key, next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['ideas'] });
    },
  });

  const onClick = (t: VoteType) => {
    if (!canVote) return;
    mutation.mutate(current?.currentUserVote === t ? null : t);
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Bewertung">
      <Button
        variant="outline"
        size="icon"
        aria-label="Hochstimmen"
        aria-pressed={current?.currentUserVote === 'Up'}
        disabled={!canVote || mutation.isPending}
        onClick={() => onClick('Up')}
        className={cn(current?.currentUserVote === 'Up' && 'border-emerald-500 text-emerald-600')}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <span className="min-w-[2rem] text-center font-semibold tabular-nums" aria-live="polite">
        {current?.score ?? 0}
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Runterstimmen"
        aria-pressed={current?.currentUserVote === 'Down'}
        disabled={!canVote || mutation.isPending}
        onClick={() => onClick('Down')}
        className={cn(current?.currentUserVote === 'Down' && 'border-rose-500 text-rose-600')}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

