import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationsApi } from '@/api/notifications';
import { QK } from '@/lib/queryClient';
import { DateText } from '@/components/common/DateText';
import { cn } from '@/lib/utils';
import type { NotificationResponse } from '@/types/api';

export function NotificationBell() {
  const qc = useQueryClient();
  const nav = useNavigate();

  const unread = useQuery({
    queryKey: QK.unreadCount,
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
  });

  const list = useQuery({
    queryKey: QK.notifications(1),
    queryFn: () => notificationsApi.list({ page: 1, pageSize: 10 }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.read(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.notifications(1) });
      const prev = qc.getQueryData(QK.notifications(1));
      qc.setQueryData(QK.notifications(1), (old: typeof list.data | undefined) =>
        old
          ? {
              ...old,
              items: old.items.map((n: NotificationResponse) =>
                n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
              ),
            }
          : old,
      );
      qc.setQueryData(QK.unreadCount, (old: { count: number } | undefined) =>
        old ? { count: Math.max(0, old.count - 1) } : old,
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.notifications(1), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK.unreadCount });
    },
  });

  const onClick = (n: NotificationResponse) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.referenceId) nav(`/ideas/${n.referenceId}`);
  };

  const count = unread.data?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Benachrichtigungen (${count} ungelesen)`}>
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h3 className="font-semibold">Benachrichtigungen</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => notificationsApi.readAll().then(() => {
              qc.invalidateQueries({ queryKey: QK.unreadCount });
              qc.invalidateQueries({ queryKey: ['notifications'] });
            })}
          >
            <Check className="mr-1 h-3.5 w-3.5" /> Alle gelesen
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {!list.data?.items?.length && (
            <p className="p-6 text-center text-sm text-muted-foreground">Keine Benachrichtigungen</p>
          )}
          {list.data?.items?.map((n) => (
            <button
              key={n.id}
              onClick={() => onClick(n)}
              className={cn(
                'flex w-full flex-col gap-1 border-b px-4 py-2 text-left text-sm last:border-0 hover:bg-accent',
                !n.isRead && 'bg-accent/40',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{n.title}</span>
                {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" aria-label="ungelesen" />}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
              <span className="text-xs text-muted-foreground">
                <DateText value={n.createdAt} />
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

