export type Role =
  | 'EMPLOYEE'
  | 'REVIEWER'
  | 'INNOVATION_MANAGER'
  | 'SPONSOR'
  | 'ADMIN'
  | 'SUPERADMIN'

export type Stage =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PRIORITIZATION'
  | 'APPROVED'
  | 'IN_IMPLEMENTATION'
  | 'DONE'
  | 'REJECTED'
  | 'ARCHIVED'

export interface MeResponse {
  id: string
  tenantId: string
  tenantName: string
  tenantPlan: string
  email: string
  displayName: string
  role: Role
}

export interface LoginResponse { token: string; user: MeResponse }

export interface Idea {
  id: string
  authorId: string
  authorName: string
  title: string
  description: string
  category: string | null
  stage: Stage
  sponsorBoost: boolean
  priorityScore: number | null
  netVotes: number
  commentCount: number
  evaluationCount: number
  submittedAt: string | null
  createdAt: string
}

export interface Comment {
  id: string
  userId: string
  userName: string
  body: string
  createdAt: string
}

export interface Evaluation {
  id: string
  reviewerId: string
  reviewerName: string
  impact: number
  feasibility: number
  strategicFit: number
  average: number
  notes: string | null
  createdAt: string
}

export interface SimilarIdea {
  id: string
  title: string
  snippet: string
  stage: Stage
  category: string | null
  similarity: number
}

export interface RefineResponse {
  suggestions: string[]
  related: SimilarIdea[]
  rationale: string
}

export interface WorkflowEvent {
  id: string
  fromStage: Stage | null
  toStage: Stage
  actorId: string
  actorName: string
  reason: string | null
  createdAt: string
}

export interface GraphNode {
  id: string
  title: string
  stage: Stage
  category: string | null
  netVotes: number
}

export interface GraphEdge {
  source: string
  target: string
  similarity: number
}

export interface IdeaGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  threshold: number
}

export interface TenantUsage {
  tenantName: string
  planCode: string
  planName: string
  seatLimit: number | null
  seatsUsed: number
  ideaLimit: number | null
  ideasThisMonth: number
  features: string[]
  priceEur: number
  licenseValid: boolean
}
