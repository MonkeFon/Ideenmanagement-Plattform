import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/useAuth';

export function PermissionGate({
  permission,
  permissions,
  mode = 'any',
  fallback = null,
  children,
}: {
  permission?: string;
  permissions?: readonly string[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  let ok = false;
  if (permission) ok = hasPermission(permission);
  else if (permissions && permissions.length > 0)
    ok = mode === 'all' ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  return <>{ok ? children : fallback}</>;
}

