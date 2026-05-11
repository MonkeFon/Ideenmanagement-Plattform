import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Lightbulb,
  Bell,
  ShieldCheck,
  Users,
  Layers,
  Tags,
  ScrollText,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import { usePermissions } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/lib/permissions';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm?: string;
};

const NAV: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ideas', label: 'Ideen', icon: Lightbulb },
  { to: '/notifications', label: 'Benachrichtigungen', icon: Bell },
  { to: '/profile', label: 'Profil', icon: User },
  { to: '/moderation', label: 'Moderation', icon: ShieldCheck, perm: PERMISSIONS.IdeasModerate },
  { to: '/admin/users', label: 'Benutzer', icon: Users, perm: PERMISSIONS.UsersRead },
  { to: '/admin/roles', label: 'Rollen', icon: Layers, perm: PERMISSIONS.RolesManage },
  { to: '/admin/categories', label: 'Kategorien', icon: Tags, perm: PERMISSIONS.CategoriesManage },
  { to: '/admin/audit-logs', label: 'Audit-Logs', icon: ScrollText, perm: PERMISSIONS.AuditRead },
];

export function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed) && !mobile;
  const { hasPermission } = usePermissions();
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card',
        mobile ? 'w-64' : collapsed ? 'w-16' : 'w-64',
        'transition-[width] duration-200',
      )}
    >
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        <Lightbulb className="mr-2 h-5 w-5 text-primary" />
        {!collapsed && <span>Ideen-Plattform</span>}
      </div>
      <nav className="flex-1 space-y-1 p-2" aria-label="Hauptnavigation">
        {NAV.filter((item) => !item.perm || hasPermission(item.perm)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground font-medium',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

