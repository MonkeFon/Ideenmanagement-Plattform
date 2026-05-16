import { api } from './client'
import type {
  Comment, Evaluation, Idea, IdeaGraph, LoginResponse, MeResponse,
  RefineResponse, SimilarIdea, Stage, TenantUsage, WorkflowEvent,
} from '@/types/api'

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get<MeResponse>('/auth/me').then((r) => r.data),
}

export const IdeaApi = {
  list: (stage?: Stage) =>
    api.get<Idea[]>('/ideas', { params: stage ? { stage } : {} }).then((r) => r.data),
  get: (id: string) => api.get<Idea>(`/ideas/${id}`).then((r) => r.data),
  create: (payload: { title: string; description: string; category?: string }) =>
    api.post<Idea>('/ideas', payload).then((r) => r.data),
  update: (id: string, payload: Partial<{ title: string; description: string; category: string }>) =>
    api.patch<Idea>(`/ideas/${id}`, payload).then((r) => r.data),
  vote: (id: string, value: -1 | 0 | 1) =>
    api.post<{ netVotes: number }>(`/ideas/${id}/votes`, { value }).then((r) => r.data),
  listComments: (id: string) => api.get<Comment[]>(`/ideas/${id}/comments`).then((r) => r.data),
  addComment: (id: string, body: string) =>
    api.post<Comment>(`/ideas/${id}/comments`, { body }).then((r) => r.data),
  listEvaluations: (id: string) => api.get<Evaluation[]>(`/ideas/${id}/evaluations`).then((r) => r.data),
  evaluate: (id: string, payload: { impact: number; feasibility: number; strategicFit: number; notes?: string }) =>
    api.post<Evaluation>(`/ideas/${id}/evaluations`, payload).then((r) => r.data),
  transition: (id: string, to: Stage, reason?: string) =>
    api.post<Idea>(`/ideas/${id}/transitions`, { to, reason }).then((r) => r.data),
  setSponsorBoost: (id: string, on: boolean) =>
    api.patch<Idea>(`/ideas/${id}/sponsor-boost`, null, { params: { on } }).then((r) => r.data),
  similar: (id: string) => api.get<SimilarIdea[]>(`/ideas/${id}/similar`).then((r) => r.data),
  refine: (id: string) => api.post<RefineResponse>(`/ideas/${id}/refine`).then((r) => r.data),
  graph: (threshold?: number) =>
    api.get<IdeaGraph>('/ideas/graph', { params: threshold !== undefined ? { threshold } : {} })
       .then((r) => r.data),
}

export const SearchApi = {
  semantic: (q: string) => api.get<SimilarIdea[]>('/search', { params: { q } }).then((r) => r.data),
}

export const WorkflowApi = {
  stages: () => api.get<Record<Stage, Stage[]>>('/workflow/stages').then((r) => r.data),
  history: (ideaId: string) =>
    api.get<WorkflowEvent[]>(`/workflow/history/${ideaId}`).then((r) => r.data),
}

export const AdminApi = {
  listUsers: () =>
    api.get<{ id: string; email: string; displayName: string; role: string; active: boolean }[]>('/admin/users')
       .then((r) => r.data),
  invite: (payload: { email: string; displayName: string; password: string; role: string }) =>
    api.post('/admin/users', payload).then((r) => r.data),
  usage: () => api.get<TenantUsage>('/admin/usage').then((r) => r.data),
}
