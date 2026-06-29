import type { Role } from '@/types/api'

export const WORKFLOW_ROLES: Role[] = [
  'REVIEWER', 'IDEA_MANAGER', 'SPONSOR', 'ADMIN', 'SUPERADMIN',
]

export const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPERADMIN']

export function hasRole(role: Role | undefined, allowed: Role[]): boolean {
  return role != null && allowed.includes(role)
}
