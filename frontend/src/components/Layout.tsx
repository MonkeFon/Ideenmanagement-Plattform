import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import {
  Lightbulb, LayoutDashboard, ListChecks, Network,
  Settings, GitBranch, LogOut, Sparkles, Menu, X,
} from 'lucide-react'
import clsx from 'clsx'

export default function Layout() {
  const { user, clear } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Auto-close the mobile drawer when the route changes.
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  if (!user) return null

  const can = (...roles: string[]) => roles.includes(user.role)

  const nav: { to: string; label: string; icon: JSX.Element; show: boolean }[] = [
    { to: '/',         label: 'Dashboard', icon: <LayoutDashboard size={18} />, show: true },
    { to: '/ideas',    label: 'All ideas', icon: <ListChecks size={18} />,       show: true },
    { to: '/graph',    label: 'Idea graph', icon: <Network size={18} />,         show: true },
    { to: '/submit',   label: 'Submit',    icon: <Sparkles size={18} />,         show: true },
    { to: '/workflow', label: 'Workflow',  icon: <GitBranch size={18} />,        show: can('INNOVATION_MANAGER','REVIEWER','SPONSOR','ADMIN','SUPERADMIN') },
    { to: '/admin',    label: 'Admin',     icon: <Settings size={18} />,         show: can('ADMIN','SUPERADMIN') },
  ]

  const sidebar = (
    <aside
      className={clsx(
        'w-64 shrink-0 border-r border-surface-border bg-white flex flex-col',
        // Mobile: fixed overlay drawer that slides in from the left.
        'fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0',
        menuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-5 h-16 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-brand-600" size={22} />
          <span className="font-semibold text-lg tracking-tight">Geistesblitz</span>
        </div>
        <button
          className="btn-ghost md:hidden"
          onClick={() => setMenuOpen(false)}
          title="Close menu"
        >
          <X size={18} />
        </button>
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
  )

  return (
    <div className="min-h-screen flex">
      {sidebar}

      {/* Mobile backdrop, only when drawer is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with burger; hidden on md+ where the static sidebar is enough. */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-2 px-4 h-14 border-b border-surface-border bg-white">
          <button
            className="btn-ghost"
            onClick={() => setMenuOpen(true)}
            title="Open menu"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Lightbulb className="text-brand-600" size={18} />
            <span className="font-semibold tracking-tight">Geistesblitz</span>
          </div>
          <span className="text-xs text-slate-500 truncate max-w-[6rem]">{user.displayName}</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
