import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

export function RequireRole({
  role,
  roles,
  children,
}: {
  role?: string;
  roles?: readonly string[];
  children?: ReactNode;
}) {
  const { hasRole } = usePermissions();
  const list = role ? [role] : roles ?? [];
  const ok = list.length === 0 || list.some((r) => hasRole(r));
  if (!ok) return <Navigate to="/forbidden" replace />;
  return <>{children ?? <Outlet />}</>;
}

