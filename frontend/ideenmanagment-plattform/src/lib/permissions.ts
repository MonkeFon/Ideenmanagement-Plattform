export const PERMISSIONS = {
  IdeasCreate: 'ideas.create',
  IdeasRead: 'ideas.read',
  IdeasUpdateOwn: 'ideas.update.own',
  IdeasDeleteOwn: 'ideas.delete.own',
  IdeasDeleteAny: 'ideas.delete.any',
  IdeasModerate: 'ideas.moderate',
  CommentsCreate: 'comments.create',
  CommentsUpdateOwn: 'comments.update.own',
  CommentsDeleteOwn: 'comments.delete.own',
  CommentsDeleteAny: 'comments.delete.any',
  VotesCast: 'votes.cast',
  AttachmentsUpload: 'attachments.upload',
  AttachmentsDeleteAny: 'attachments.delete.any',
  CategoriesManage: 'categories.manage',
  NotificationsRead: 'notifications.read',
  UsersRead: 'users.read',
  UsersManage: 'users.manage',
  RolesManage: 'roles.manage',
  AuditRead: 'audit.read',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
  Mitarbeiter: 'Mitarbeiter',
  Moderator: 'Moderator',
  Administrator: 'Administrator',
} as const;
export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export function hasPermission(
  userPermissions: readonly string[] | undefined,
  required: string,
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(required);
}

export function hasAnyPermission(
  userPermissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  if (!userPermissions || required.length === 0) return false;
  return required.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(
  userPermissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  if (!userPermissions) return false;
  return required.every((p) => userPermissions.includes(p));
}

export function hasRole(userRoles: readonly string[] | undefined, role: string): boolean {
  return !!userRoles?.includes(role);
}

