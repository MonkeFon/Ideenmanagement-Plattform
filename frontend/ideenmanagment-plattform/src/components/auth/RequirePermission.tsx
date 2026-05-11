import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

export function RequirePermission({
  permission,
  permissions,
  mode = 'any',
  children,
}: {
  permission?: string;
  permissions?: readonly string[];
  mode?: 'any' | 'all';
  children?: ReactNode;
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  let ok = true;
  if (permission) ok = hasPermission(permission);
  else if (permissions && permissions.length > 0)
    ok = mode === 'all' ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  if (!ok) return <Navigate to="/forbidden" replace />;
  return <>{children ?? <Outlet />}</>;
}

