import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { commentsApi } from '@/api/comments';
import { QK } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { DateText } from '@/components/common/DateText';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/lib/permissions';
import type { CommentResponse } from '@/types/api';
import { handleApiError } from '@/lib/apiError';
import { toast } from 'sonner';

export function CommentList({ ideaId }: { ideaId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const list = useQuery({
    queryKey: QK.ideaComments(ideaId, 1),
    queryFn: () => commentsApi.list(ideaId, { page: 1, pageSize: 50 }),
  });

  const create = useMutation({
    mutationFn: (body: { content: string; parentCommentId?: string | null }) =>
      commentsApi.create(ideaId, body),
    onSuccess: () => {
      setText('');
      setReplyText('');
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: QK.ideaComments(ideaId, 1) });
      qc.invalidateQueries({ queryKey: QK.idea(ideaId) });
    },
    onError: (e) => handleApiError(e),
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => commentsApi.remove(ideaId, commentId),
    onSuccess: () => {
      toast.success('Kommentar gelöscht');
      qc.invalidateQueries({ queryKey: QK.ideaComments(ideaId, 1) });
    },
    onError: (e) => handleApiError(e),
  });

  const all = list.data?.items ?? [];
  const tops = all.filter((c) => !c.parentCommentId);
  const repliesOf = (id: string) => all.filter((c) => c.parentCommentId === id);

  const renderItem = (c: CommentResponse, depth = 0) => {
    const canDelete = c.authorId === user?.id || hasPermission(PERMISSIONS.CommentsDeleteAny);
    return (
      <li key={c.id} className={depth === 0 ? '' : 'ml-6 mt-2 border-l pl-3'}>
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm">
            <span className="font-medium">{c.authorName}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              <DateText value={c.createdAt} />
            </span>
            <p className="mt-1 whitespace-pre-wrap break-words">{c.content}</p>
            {depth === 0 && (
              <button
                type="button"
                className="mt-1 text-xs text-primary hover:underline"
                onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              >
                {replyTo === c.id ? 'Abbrechen' : 'Antworten'}
              </button>
            )}
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Kommentar löschen"
              onClick={() => remove.mutate(c.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {replyTo === c.id && (
          <form
            className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!replyText.trim()) return;
              create.mutate({ content: replyText, parentCommentId: c.id });
            }}
          >
            <Textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Antwort …"
            />
            <Button size="sm" type="submit" disabled={create.isPending}>Antworten</Button>
          </form>
        )}
        {depth === 0 && repliesOf(c.id).length > 0 && (
          <ul className="mt-2 space-y-2">{repliesOf(c.id).map((r) => renderItem(r, 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <section aria-label="Kommentare" className="space-y-4">
      <h2 className="text-lg font-semibold">Kommentare ({all.length})</h2>
      {hasPermission(PERMISSIONS.CommentsCreate) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            create.mutate({ content: text });
          }}
          className="space-y-2"
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Kommentar verfassen …"
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={create.isPending || !text.trim()}>
              Kommentieren
            </Button>
          </div>
        </form>
      )}
      {all.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Kommentare.</p>
      ) : (
        <ul className="space-y-3">{tops.map((c) => renderItem(c))}</ul>
      )}
    </section>
  );
}

