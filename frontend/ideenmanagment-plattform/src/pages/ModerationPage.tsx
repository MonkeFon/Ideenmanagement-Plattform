import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, XCircle, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea, FormField } from '@/components/ui/input';
import { moderationApi } from '@/api/moderation';
import { QK } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DateText } from '@/components/common/DateText';
import { rejectSchema, type RejectFormValues } from '@/lib/validation';
import { handleApiError } from '@/lib/apiError';
import { Link } from 'react-router-dom';

export default function ModerationPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);

  const queue = useQuery({
    queryKey: QK.moderationQueue(page),
    queryFn: () => moderationApi.queue({ page, pageSize: 20 }),
  });

  const inv = () => {
    qc.invalidateQueries({ queryKey: ['moderation'] });
    qc.invalidateQueries({ queryKey: ['ideas'] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => moderationApi.approve(id),
    onSuccess: () => { toast.success('Genehmigt'); inv(); },
    onError: (e) => handleApiError(e),
  });
  const archive = useMutation({
    mutationFn: (id: string) => moderationApi.archive(id),
    onSuccess: () => { toast.success('Archiviert'); inv(); },
    onError: (e) => handleApiError(e),
  });
  const reject = useMutation({
    mutationFn: (v: { id: string; reason: string }) => moderationApi.reject(v.id, { reason: v.reason }),
    onSuccess: () => { toast.success('Abgelehnt'); inv(); setRejectId(null); },
    onError: (e) => handleApiError(e),
  });

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  });

  return (
    <>
      <PageHeader title="Moderations-Warteschlange" description="Eingereichte Ideen prüfen" />
      {!queue.data?.items?.length && <EmptyState title="Keine offenen Ideen" />}
      <ul className="space-y-3">
        {queue.data?.items?.map((i) => (
          <Card key={i.id} className="p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link to={`/ideas/${i.id}`} className="font-semibold hover:underline">
                  {i.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={i.status} />
                  <span>{i.authorName}</span>
                  <span>·</span>
                  <span>{i.categoryName}</span>
                  <span>·</span>
                  <DateText value={i.createdAt} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approve.mutate(i.id)} disabled={approve.isPending}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Genehmigen
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setRejectId(i.id); form.reset(); }}>
                  <XCircle className="mr-1 h-4 w-4" /> Ablehnen
                </Button>
                <Button size="sm" variant="outline" onClick={() => archive.mutate(i.id)} disabled={archive.isPending}>
                  <Archive className="mr-1 h-4 w-4" /> Archivieren
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </ul>
      {queue.data && (
        <Pagination
          page={queue.data.page}
          pageSize={queue.data.pageSize}
          total={queue.data.total}
          totalPages={queue.data.totalPages}
          hasNext={queue.data.hasNext}
          hasPrevious={queue.data.hasPrevious}
          onPageChange={setPage}
        />
      )}
      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Idee ablehnen</DialogTitle>
            <DialogDescription>Begründen Sie die Ablehnung (mind. 5 Zeichen).</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((v) => rejectId && reject.mutate({ id: rejectId, reason: v.reason }))}
            className="space-y-4"
          >
            <FormField label="Begründung" error={form.formState.errors.reason?.message}>
              <Textarea rows={4} {...form.register('reason')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectId(null)}>Abbrechen</Button>
              <Button type="submit" variant="destructive" disabled={reject.isPending}>Ablehnen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

