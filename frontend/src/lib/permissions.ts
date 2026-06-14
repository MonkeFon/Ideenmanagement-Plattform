import type { Role } from '@/types/api'

/**
 * Single source of truth for role-gated areas. Both the navigation (which links
 * to show) and the router (which routes to allow) import these, so the menu and
 * the actual access can never drift apart.
 *
 * Mirrors the backend authorization: EMPLOYEE can submit/vote/comment but cannot
 * drive the workflow state machine (see IdeaWorkflow.java), so they must not see
 * the Workflow board at all — not in the menu and not via a direct URL.
 */
export const WORKFLOW_ROLES: Role[] = [
  'REVIEWER', 'IDEA_MANAGER', 'SPONSOR', 'ADMIN', 'SUPERADMIN',
]

export const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPERADMIN']

export function hasRole(role: Role | undefined, allowed: Role[]): boolean {
  return role != null && allowed.includes(role)
}
