import { ENDPOINTS } from './endpoints';
import { get, post } from './client';
import type {
  IdeaDetailResponse,
  IdeaListItemResponse,
  PagedResult,
  RejectIdeaRequest,
} from '@/types/api';

export const moderationApi = {
  queue: (params: { page?: number; pageSize?: number }) =>
    get<PagedResult<IdeaListItemResponse>>(ENDPOINTS.moderation.queue, { params }),
  approve: (id: string) => post<IdeaDetailResponse>(ENDPOINTS.moderation.approve(id)),
  reject: (id: string, body: RejectIdeaRequest) =>
    post<IdeaDetailResponse>(ENDPOINTS.moderation.reject(id), body),
  archive: (id: string) => post<IdeaDetailResponse>(ENDPOINTS.moderation.archive(id)),
};

