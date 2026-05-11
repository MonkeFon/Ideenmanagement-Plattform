import type {
  AttachmentResponse,
  AuditLogResponse,
  AuthResponse,
  CategoryResponse,
  CommentResponse,
  IdeaDetailResponse,
  IdeaListItemResponse,
  NotificationResponse,
  PermissionResponse,
  RoleResponse,
  UserDetailResponse,
} from '@/types/api';

const now = () => new Date().toISOString();
const userId = '11111111-1111-1111-1111-111111111111';

export const db = {
  users: [
    {
      id: userId,
      email: 'admin@example.com',
      userName: 'admin',
      firstName: 'Anna',
      lastName: 'Admin',
      isActive: true,
      createdAt: now(),
      lastLoginAt: now(),
      roles: ['Administrator'],
      permissions: [
        'ideas.create','ideas.read','ideas.update.own','ideas.delete.own','ideas.delete.any','ideas.moderate',
        'comments.create','comments.update.own','comments.delete.own','comments.delete.any',
        'votes.cast','attachments.upload','attachments.delete.any','categories.manage',
        'notifications.read','users.read','users.manage','roles.manage','audit.read',
      ],
    },
  ] as UserDetailResponse[],
  permissions: [
    'ideas.create','ideas.read','ideas.update.own','ideas.delete.own','ideas.delete.any','ideas.moderate',
    'comments.create','comments.update.own','comments.delete.own','comments.delete.any',
    'votes.cast','attachments.upload','attachments.delete.any','categories.manage',
    'notifications.read','users.read','users.manage','roles.manage','audit.read',
  ].map<PermissionResponse>((code, i) => ({ id: `perm-${i}`, code, description: code })),
  roles: [
    { id: 'r1', name: 'Mitarbeiter', description: '', permissions: ['ideas.create','ideas.read','votes.cast','comments.create'] },
    { id: 'r2', name: 'Moderator', description: '', permissions: ['ideas.moderate','users.read'] },
    { id: 'r3', name: 'Administrator', description: 'Vollzugriff', permissions: ['users.manage','roles.manage','audit.read'] },
  ] as RoleResponse[],
  categories: [
    { id: 'c1', name: 'Produkt', description: 'Produktideen', isActive: true },
    { id: 'c2', name: 'Prozess', description: 'Prozessverbesserungen', isActive: true },
  ] as CategoryResponse[],
  ideas: [
    {
      id: 'i1', title: 'Bessere Kaffeemaschine', description: 'Wir brauchen **eine bessere Kaffeemaschine**.',
      status: 'Submitted',
      authorId: userId, authorName: 'Anna Admin',
      categoryId: 'c2', categoryName: 'Prozess',
      createdAt: now(), updatedAt: null, approvedAt: null, rejectedReason: null,
      viewCount: 12, voteUp: 5, voteDown: 1, voteScore: 4, attachments: [],
    },
  ] as IdeaDetailResponse[],
  comments: [] as CommentResponse[],
  attachments: [] as AttachmentResponse[],
  notifications: [
    { id: 'n1', type: 'IdeaSubmitted', title: 'Idee eingereicht', message: 'Ihre Idee wurde eingereicht.', isRead: false, readAt: null, referenceId: 'i1', createdAt: now() },
  ] as NotificationResponse[],
  auditLogs: [
    { id: 'a1', userId, userName: 'admin', action: 'Login', entityName: 'User', entityId: userId, ipAddress: '127.0.0.1', timestamp: now() },
  ] as AuditLogResponse[],
  tokens: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
};

export function makeAuthResponse(): AuthResponse {
  const u = db.users[0];
  return {
    accessToken: db.tokens.accessToken,
    refreshToken: db.tokens.refreshToken,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    user: {
      id: u.id, email: u.email, userName: u.userName,
      firstName: u.firstName, lastName: u.lastName,
      isActive: u.isActive, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, roles: u.roles,
    },
  };
}

export function ideaToList(i: IdeaDetailResponse): IdeaListItemResponse {
  return {
    id: i.id, title: i.title, status: i.status,
    authorId: i.authorId, authorName: i.authorName,
    categoryId: i.categoryId, categoryName: i.categoryName,
    voteScore: i.voteScore, commentCount: db.comments.filter((c) => c.ideaId === i.id).length,
    createdAt: i.createdAt,
  };
}

export function envelope<T>(data: T) {
  return { success: true, data };
}

export function paged<T>(items: T[], page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items: slice, page, pageSize, total, totalPages,
    hasNext: page < totalPages, hasPrevious: page > 1,
  };
}

