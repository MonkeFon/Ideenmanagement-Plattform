import { ENDPOINTS } from './endpoints';
import { del, get, post } from './client';
import type { NotificationResponse, PagedResult, UnreadCountResponse } from '@/types/api';

export const notificationsApi = {
  list: (params: { page?: number; pageSize?: number }) =>
    get<PagedResult<NotificationResponse>>(ENDPOINTS.notifications.list, { params }),
  unreadCount: () => get<UnreadCountResponse>(ENDPOINTS.notifications.unreadCount),
  read: (id: string) => post<void>(ENDPOINTS.notifications.read(id)),
  readAll: () => post<void>(ENDPOINTS.notifications.readAll),
  remove: (id: string) => del<void>(ENDPOINTS.notifications.delete(id)),
};

