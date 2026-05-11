import { useAuthStore } from '@/stores/authStore';
import { hasAllPermissions, hasAnyPermission, hasPermission, hasRole } from '@/lib/permissions';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const accessToken = useAuthStore((s) => s.accessToken);
  return {
    user,
    permissions,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
  };
}

export function usePermissions() {
  const permissions = useAuthStore((s) => s.permissions);
  const roles = useAuthStore((s) => s.user?.roles ?? []);
  return {
    permissions,
    roles,
    hasPermission: (p: string) => hasPermission(permissions, p),
    hasAnyPermission: (ps: readonly string[]) => hasAnyPermission(permissions, ps),
    hasAllPermissions: (ps: readonly string[]) => hasAllPermissions(permissions, ps),
    hasRole: (r: string) => hasRole(roles, r),
  };
}

