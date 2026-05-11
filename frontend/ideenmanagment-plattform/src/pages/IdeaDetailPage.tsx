import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Edit, Send, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { ideasApi } from '@/api/ideas';
import { votesApi } from '@/api/votes';
import { QK } from '@/lib/queryClient';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DateText } from '@/components/common/DateText';
import { SafeMarkdown } from '@/components/common/SafeMarkdown';
import { VoteButtons } from '@/components/ideas/VoteButtons';
import { CommentList } from '@/components/ideas/CommentList';
import { AttachmentUploader } from '@/components/ideas/AttachmentUploader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useState } from 'react';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/lib/permissions';
import { handleApiError } from '@/lib/apiError';
import { PageLoading } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const idea = useQuery({
    queryKey: QK.idea(id!),
    queryFn: () => ideasApi.byId(id!),
    enabled: !!id,
  });
  const summary = useQuery({
    queryKey: QK.voteSummary(id!),
    queryFn: () => votesApi.summary(id!),
    enabled: !!id,
  });

  const submit = useMutation({
    mutationFn: () => ideasApi.submit(id!),
    onSuccess: () => {
      toast.success('Idee eingereicht');
      qc.invalidateQueries({ queryKey: QK.idea(id!) });
    },
    onError: (e) => handleApiError(e),
  });

  const remove = useMutation({
    mutationFn: () => ideasApi.remove(id!),
    onSuccess: () => {
      toast.success('Idee gelöscht');
      nav('/ideas', { replace: true });
    },
    onError: (e) => handleApiError(e),
  });

  if (idea.isLoading) return <PageLoading />;
  if (idea.isError || !idea.data) return <ErrorState onRetry={() => idea.refetch()} />;

  const data = idea.data;
  const isOwner = data.authorId === user?.id;
  const canEdit = isOwner || hasPermission(PERMISSIONS.IdeasModerate);
  const canDelete = isOwner || hasPermission(PERMISSIONS.IdeasDeleteAny);
  const canSubmit = isOwner && data.status === 'Draft';

  return (
    <>
      <PageHeader
        title={data.title}
        actions={
          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                <Send className="mr-2 h-4 w-4" /> Einreichen
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" asChild>
                <Link to={`/ideas/${data.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Bearbeiten</Link>
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Löschen
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <StatusBadge status={data.status} />
        <span>von <strong>{data.authorName}</strong></span>
        <span>·</span>
        <span>{data.categoryName}</span>
        <span>·</span>
        <DateText value={data.createdAt} />
        <span className="ml-auto flex items-center gap-1"><Eye className="h-4 w-4" /> {data.viewCount}</span>
        <VoteButtons ideaId={data.id} summary={summary.data} />
      </div>

      {data.rejectedReason && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
          <strong>Ablehnungsgrund:</strong> {data.rejectedReason}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <SafeMarkdown>{data.description}</SafeMarkdown>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <CommentList ideaId={data.id} />
        <AttachmentUploader
          ideaId={data.id}
          attachments={data.attachments}
          authorId={data.authorId}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Idee löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        destructive
        onConfirm={() => remove.mutateAsync()}
      />
    </>
  );
}

