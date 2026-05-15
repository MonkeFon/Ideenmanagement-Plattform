import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { Lightbulb, LayoutDashboard, ListChecks, Settings, GitBranch, LogOut, Sparkles } from 'lucide-react'
import clsx from 'clsx'

export default function Layout() {
  const { user, clear } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const can = (...roles: string[]) => roles.includes(user.role)

  const nav: { to: string; label: string; icon: JSX.Element; show: boolean }[] = [
    { to: '/',         label: 'Dashboard', icon: <LayoutDashboard size={18} />, show: true },
    { to: '/ideas',    label: 'All ideas', icon: <ListChecks size={18} />,       show: true },
    { to: '/submit',   label: 'Submit',    icon: <Sparkles size={18} />,         show: true },
    { to: '/workflow', label: 'Workflow',  icon: <GitBranch size={18} />,        show: can('INNOVATION_MANAGER','REVIEWER','SPONSOR','ADMIN','SUPERADMIN') },
    { to: '/admin',    label: 'Admin',     icon: <Settings size={18} />,         show: can('ADMIN','SUPERADMIN') },
  ]

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-surface-border bg-white flex flex-col">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-surface-border">
          <Lightbulb className="text-brand-600" size={22} />
          <span className="font-semibold text-lg tracking-tight">Geistesblitz</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.filter((n) => n.show).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
                )
              }
            >
              {n.icon}
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-surface-border p-4">
          <div className="text-xs text-slate-500">{user.tenantName} · <span className="font-semibold">{user.tenantPlan}</span></div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">{user.displayName}</div>
              <div className="text-xs text-slate-500">{user.role.replaceAll('_',' ').toLowerCase()}</div>
            </div>
            <button
              className="btn-ghost"
              onClick={() => { clear(); navigate('/login') }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
