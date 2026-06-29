export type Role =
  | 'EMPLOYEE'
  | 'REVIEWER'
  | 'IDEA_MANAGER'
  | 'SPONSOR'
  | 'ADMIN'
  | 'SUPERADMIN'

export type Stage =
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

  tenantBrandColor: string | null
  email: string
  displayName: string
  role: Role
}

export interface LoginResponse { token: string; user: MeResponse }

export interface Idea {
  id: string

  reference: number
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
  campaignId: string | null
  campaignName: string | null
  campaignColor: string | null

  preferredReviewerId: string | null
  preferredReviewerName: string | null
  preferredManagerId: string | null
  preferredManagerName: string | null
  assignedReviewerId: string | null
  assignedReviewerName: string | null
  assignedManagerId: string | null
  assignedManagerName: string | null
}

export interface AssignableUser {
  id: string
  displayName: string
  role: Role
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

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  reply: string
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

export interface Campaign {
  id: string
  name: string
  description: string
  color: string
  startsAt: string | null
  endsAt: string | null
  createdBy: string
  createdByName: string
  createdAt: string
  ideaCount: number
}

export interface CampaignDetail {
  campaign: Campaign
  ideas: Idea[]
}

export interface TopIdea {
  id: string
  title: string
  authorName: string
  stage: Stage
  category: string | null
  netVotes: number
  priorityScore: number | null
  commentCount: number
  rank: number
}

export interface TopContributor {
  userId: string
  displayName: string
  role: Role
  ideasSubmitted: number
  votesReceived: number
  commentsPosted: number
  evaluationsGiven: number
  score: number
  rank: number
}

export interface Leaderboard {
  topIdeas: TopIdea[]
  topContributors: TopContributor[]
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

export interface PlanOption {
  code: string
  displayName: string
  seatLimit: number | null
  ideaLimit: number | null
  features: string[]
  priceEur: number
  current: boolean
}
