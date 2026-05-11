// API endpoint constants. Kept as separate consts to avoid IDE auto-reformat issues.
const auth = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
  changePassword: '/api/auth/change-password',
  forgotPassword: '/api/auth/forgot-password',
  resetPassword: '/api/auth/reset-password',
};

const users = {
  me: '/api/users/me',
  list: '/api/users',
  byId: (id: string) => `/api/users/${id}`,
  activate: (id: string) => `/api/users/${id}/activate`,
  deactivate: (id: string) => `/api/users/${id}/deactivate`,
  roles: (id: string) => `/api/users/${id}/roles`,
  roleById: (id: string, roleId: string) => `/api/users/${id}/roles/${roleId}`,
};

const roles = {
  list: '/api/roles',
  byId: (id: string) => `/api/roles/${id}`,
  permissions: '/api/roles/permissions',
  rolePermissions: (id: string) => `/api/roles/${id}/permissions`,
  rolePermissionById: (id: string, permId: string) =>
    `/api/roles/${id}/permissions/${permId}`,
};

const categories = {
  list: '/api/categories',
  byId: (id: string) => `/api/categories/${id}`,
};

const ideas = {
  list: '/api/ideas',
  byId: (id: string) => `/api/ideas/${id}`,
  submit: (id: string) => `/api/ideas/${id}/submit`,
  comments: (ideaId: string) => `/api/ideas/${ideaId}/comments`,
  commentById: (ideaId: string, commentId: string) =>
    `/api/ideas/${ideaId}/comments/${commentId}`,
  votes: (ideaId: string) => `/api/ideas/${ideaId}/votes`,
  votesSummary: (ideaId: string) => `/api/ideas/${ideaId}/votes/summary`,
  attachments: (ideaId: string) => `/api/ideas/${ideaId}/attachments`,
  attachmentById: (ideaId: string, id: string) =>
    `/api/ideas/${ideaId}/attachments/${id}`,
  attachmentDownload: (ideaId: string, id: string) =>
    `/api/ideas/${ideaId}/attachments/${id}/download`,
};

const moderation = {
  queue: '/api/moderation/queue',
  approve: (id: string) => `/api/moderation/ideas/${id}/approve`,
  reject: (id: string) => `/api/moderation/ideas/${id}/reject`,
  archive: (id: string) => `/api/moderation/ideas/${id}/archive`,
};

const notifications = {
  list: '/api/notifications',
  unreadCount: '/api/notifications/unread-count',
  read: (id: string) => `/api/notifications/${id}/read`,
  readAll: '/api/notifications/read-all',
  delete: (id: string) => `/api/notifications/${id}`,
};

const audit = { list: '/api/audit-logs' };
const health = '/api/health';

export const ENDPOINTS = {
  auth,
  users,
  roles,
  categories,
  ideas,
  moderation,
  notifications,
  audit,
  health,
};
