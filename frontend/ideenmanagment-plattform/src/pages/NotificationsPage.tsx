import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { notificationsApi } from '@/api/notifications';
import { QK } from '@/lib/queryClient';
import { Pagination } from '@/components/common/Pagination';
import { DateText } from '@/components/common/DateText';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { handleApiError } from '@/lib/apiError';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const nav = useNavigate();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: QK.notifications(page),
    queryFn: () => notificationsApi.list({ page, pageSize }),
  });

  const readAll = useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => handleApiError(e),
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e) => handleApiError(e),
  });

  return (
    <>
      <PageHeader
        title="Benachrichtigungen"
        actions={
          <Button variant="outline" onClick={() => readAll.mutate()}>
            <Check className="mr-2 h-4 w-4" /> Alle als gelesen
          </Button>
        }
      />
      {!list.data?.items?.length && <EmptyState title="Keine Benachrichtigungen" />}
      <ul className="space-y-2">
        {list.data?.items?.map((n) => (
          <Card key={n.id} className={cn('p-3', !n.isRead && 'border-primary/40')}>
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={() => {
                  if (!n.isRead) notificationsApi.read(n.id).then(() => qc.invalidateQueries({ queryKey: ['notifications'] }));
                  if (n.referenceId) nav(`/ideas/${n.referenceId}`);
                }}
                className="flex-1 text-left"
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground"><DateText value={n.createdAt} /></p>
              </button>
              <Button variant="ghost" size="icon" aria-label="Löschen" onClick={() => remove.mutate(n.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </ul>
      {list.data && (
        <Pagination
          page={list.data.page}
          pageSize={list.data.pageSize}
          total={list.data.total}
          totalPages={list.data.totalPages}
          hasNext={list.data.hasNext}
          hasPrevious={list.data.hasPrevious}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      )}
    </>
  );
}

