import { ENDPOINTS } from './endpoints';
import { del, get, post, put } from './client';
import type {
  CommentResponse,
  CreateCommentRequest,
  PagedResult,
  UpdateCommentRequest,
} from '@/types/api';

export const commentsApi = {
  list: (ideaId: string, params?: { page?: number; pageSize?: number }) =>
    get<PagedResult<CommentResponse>>(ENDPOINTS.ideas.comments(ideaId), { params }),
  create: (ideaId: string, body: CreateCommentRequest) =>
    post<CommentResponse>(ENDPOINTS.ideas.comments(ideaId), body),
  update: (ideaId: string, commentId: string, body: UpdateCommentRequest) =>
    put<CommentResponse>(ENDPOINTS.ideas.commentById(ideaId, commentId), body),
  remove: (ideaId: string, commentId: string) =>
    del<void>(ENDPOINTS.ideas.commentById(ideaId, commentId)),
};

