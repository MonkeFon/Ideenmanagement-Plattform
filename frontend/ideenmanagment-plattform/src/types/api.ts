// Vollständige TS-Modelle 1:1 zum Backend
export type IdeaStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'Rejected'
  | 'Archived';

export type VoteType = 'Up' | 'Down';

export type NotificationType =
  | 'System'
  | 'IdeaSubmitted'
  | 'IdeaApproved'
  | 'IdeaRejected'
  | 'IdeaCommented'
  | 'IdeaVoted'
  | 'IdeaArchived'
  | 'CommentReplied';

export type AuditAction =
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Login'
  | 'Logout'
  | 'LoginFailed'
  | 'Approve'
  | 'Reject'
  | 'Archive'
  | 'RoleAssigned'
  | 'RoleRemoved'
  | 'PasswordChanged';

// === Common ===
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProblemDetailsError {
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

// === Auth ===
export interface RegisterRequest {
  email: string;
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  emailOrUserName: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserResponse;
}

// === User ===
export interface UserResponse {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roles: string[];
}

export interface UserDetailResponse extends UserResponse {
  permissions: string[];
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

export interface AssignRoleRequest {
  roleId: string;
}

export interface UserFilterQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  roleId?: string;
}

// === Roles & Permissions ===
export interface RoleResponse {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string | null;
}

export interface AssignPermissionRequest {
  permissionId: string;
}

export interface PermissionResponse {
  id: string;
  code: string;
  description?: string | null;
}

// === Category ===
export interface CategoryResponse {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string | null;
  isActive: boolean;
}

// === Idea ===
export interface IdeaListItemResponse {
  id: string;
  title: string;
  status: IdeaStatus;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  voteScore: number;
  commentCount: number;
  createdAt: string;
}

export interface IdeaDetailResponse {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  viewCount: number;
  voteUp: number;
  voteDown: number;
  voteScore: number;
  attachments: AttachmentResponse[];
}

export interface CreateIdeaRequest {
  title: string;
  description: string;
  categoryId: string;
}

export interface UpdateIdeaRequest {
  title: string;
  description: string;
  categoryId: string;
}

export interface IdeaFilterQuery {
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'title' | 'votes' | 'status';
  sortDir?: 'asc' | 'desc';
  search?: string;
  categoryId?: string;
  status?: IdeaStatus;
  authorId?: string;
}

// === Comment ===
export interface CommentResponse {
  id: string;
  ideaId: string;
  authorId: string;
  authorName: string;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string | null;
}

export interface UpdateCommentRequest {
  content: string;
}

// === Vote ===
export interface VoteRequest {
  voteType: VoteType;
}

export interface VoteSummaryResponse {
  ideaId: string;
  up: number;
  down: number;
  score: number;
  currentUserVote: VoteType | null;
}

// === Attachment ===
export interface AttachmentResponse {
  id: string;
  ideaId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedById: string;
}

// === Moderation ===
export interface RejectIdeaRequest {
  reason: string;
}

// === Notifications ===
export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

// === Audit-Logs ===
export interface AuditLogResponse {
  id: string;
  userId: string | null;
  userName: string | null;
  action: AuditAction;
  entityName: string;
  entityId: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export interface AuditLogFilterQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  entityName?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
}

