import { ENDPOINTS } from './endpoints';
import { del, get, post, put } from './client';
import type {
  CreateIdeaRequest,
  IdeaDetailResponse,
  IdeaFilterQuery,
  IdeaListItemResponse,
  PagedResult,
  UpdateIdeaRequest,
} from '@/types/api';

export const ideasApi = {
  list: (q: IdeaFilterQuery) =>
    get<PagedResult<IdeaListItemResponse>>(ENDPOINTS.ideas.list, { params: q }),
  byId: (id: string) => get<IdeaDetailResponse>(ENDPOINTS.ideas.byId(id)),
  create: (body: CreateIdeaRequest) => post<IdeaDetailResponse>(ENDPOINTS.ideas.list, body),
  update: (id: string, body: UpdateIdeaRequest) =>
    put<IdeaDetailResponse>(ENDPOINTS.ideas.byId(id), body),
  remove: (id: string) => del<void>(ENDPOINTS.ideas.byId(id)),
  submit: (id: string) => post<IdeaDetailResponse>(ENDPOINTS.ideas.submit(id)),
};

