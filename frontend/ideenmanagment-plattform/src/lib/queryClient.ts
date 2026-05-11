import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

export const QK = {
  me: ['me'] as const,
  ideas: (q: unknown) => ['ideas', q] as const,
  idea: (id: string) => ['idea', id] as const,
  ideaComments: (id: string, page?: number) => ['idea', id, 'comments', page ?? 1] as const,
  voteSummary: (id: string) => ['idea', id, 'votes'] as const,
  attachments: (id: string) => ['idea', id, 'attachments'] as const,
  notifications: (page?: number) => ['notifications', page ?? 1] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  categories: ['categories'] as const,
  users: (q: unknown) => ['users', q] as const,
  user: (id: string) => ['user', id] as const,
  roles: ['roles'] as const,
  permissions: ['permissions'] as const,
  moderationQueue: (page?: number) => ['moderation', page ?? 1] as const,
  auditLogs: (q: unknown) => ['audit-logs', q] as const,
};

