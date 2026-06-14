import { api } from './client'
import type {
  Campaign, CampaignDetail, ChatMessage, ChatResponse,
  Comment, Evaluation, Idea, IdeaGraph, Leaderboard, LoginResponse, MeResponse,
  PlanOption, RefineResponse, SimilarIdea, Stage, TenantUsage, WorkflowEvent,
} from '@/types/api'

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get<MeResponse>('/auth/me').then((r) => r.data),
}

// ── DEV / DEMO ONLY: god-mode data editor (hidden /dev page). Backend is gated
// behind ideaplatform.dev.data-console.enabled; these calls 404 when it's off.
export interface DevColumn {
  column_name: string
  data_type: string
  udt_name: string
  is_nullable: 'YES' | 'NO'
  column_default: string | null
}
export interface DevTableData {
  table: string
  columns: DevColumn[]
  primaryKey: string[]
  rows: Record<string, unknown>[]
  total: number
  limit: number
  offset: number
}
export const DevDataApi = {
  tables: () => api.get<string[]>('/dev/data/tables').then((r) => r.data),
  rows: (table: string, params: { limit?: number; offset?: number; orderBy?: string; dir?: string } = {}) =>
    api.get<DevTableData>(`/dev/data/tables/${table}`, { params }).then((r) => r.data),
  insert: (table: string, values: Record<string, unknown>) =>
    api.post<Record<string, unknown>>(`/dev/data/tables/${table}`, values).then((r) => r.data),
  update: (table: string, key: Record<string, unknown>, values: Record<string, unknown>) =>
    api.put<Record<string, unknown>>(`/dev/data/tables/${table}`, { key, values }).then((r) => r.data),
  remove: (table: string, key: Record<string, unknown>) =>
    api.delete<{ deleted: number }>(`/dev/data/tables/${table}`, { data: { key } }).then((r) => r.data),
}

export const IdeaApi = {
  list: (stage?: Stage) =>
    api.get<Idea[]>('/ideas', { params: stage ? { stage } : {} }).then((r) => r.data),
  get: (id: string) => api.get<Idea>(`/ideas/${id}`).then((r) => r.data),
  create: (payload: { title: string; description: string; category?: string; campaignId?: string }) =>
    api.post<Idea>('/ideas', payload).then((r) => r.data),
  update: (id: string, payload: Partial<{ title: string; description: string; category: string; campaignId: string }>) =>
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
  chat: (id: string, messages: ChatMessage[]) =>
    api.post<ChatResponse>(`/ideas/${id}/chat`, { messages }).then((r) => r.data),
  graph: (threshold?: number) =>
    api.get<IdeaGraph>('/ideas/graph', { params: threshold !== undefined ? { threshold } : {} })
       .then((r) => r.data),
}

export const SearchApi = {
  semantic: (q: string) => api.get<SimilarIdea[]>('/search', { params: { q } }).then((r) => r.data),
  // Same endpoint as `semantic` but tagged with `meta.silent` so a background
  // duplicate-check on the Submit page doesn't spam toasts when the network
  // hiccups while the user is still typing.
  dupCheck: (q: string) =>
    api.get<SimilarIdea[]>('/search', {
      params: { q },
      // axios passes unknown config properties through; our response interceptor
      // reads `config.meta.silent` to suppress the error toast.
      meta: { silent: true },
    } as any).then((r) => r.data),
}

export const WorkflowApi = {
  stages: () => api.get<Record<Stage, Stage[]>>('/workflow/stages').then((r) => r.data),
  history: (ideaId: string) =>
    api.get<WorkflowEvent[]>(`/workflow/history/${ideaId}`).then((r) => r.data),
}

export const LeaderboardApi = {
  get: () => api.get<Leaderboard>('/leaderboard').then((r) => r.data),
}

export const CampaignApi = {
  list: () => api.get<Campaign[]>('/campaigns').then((r) => r.data),
  get: (id: string) => api.get<CampaignDetail>(`/campaigns/${id}`).then((r) => r.data),
  create: (payload: { name: string; description: string; color?: string; startsAt?: string; endsAt?: string }) =>
    api.post<Campaign>('/campaigns', payload).then((r) => r.data),
  update: (id: string, payload: Partial<{ name: string; description: string; color: string; startsAt: string; endsAt: string }>) =>
    api.patch<Campaign>(`/campaigns/${id}`, payload).then((r) => r.data),
  delete: (id: string) => api.delete(`/campaigns/${id}`).then((r) => r.data),
}

export const AdminApi = {
  listUsers: () =>
    api.get<{ id: string; email: string; displayName: string; role: string; active: boolean }[]>('/admin/users')
       .then((r) => r.data),
  invite: (payload: { email: string; displayName: string; password: string; role: string }) =>
    api.post('/admin/users', payload).then((r) => r.data),
  usage: () => api.get<TenantUsage>('/admin/usage').then((r) => r.data),
}

export const SubscriptionApi = {
  plans: () => api.get<PlanOption[]>('/subscription/plans').then((r) => r.data),
  changePlan: (planCode: string) =>
    api.put<TenantUsage>('/subscription/plan', { planCode }).then((r) => r.data),
}
