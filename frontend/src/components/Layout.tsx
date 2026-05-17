import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { applyTheme, useTheme, type Theme } from '@/store/theme'
import {
  LayoutDashboard, ListChecks, Network, Trophy, Megaphone,
  Settings as SettingsIcon, Shield, GitBranch, LogOut, Pencil, Menu, X,
  Sun, Moon, Monitor,
} from 'lucide-react'
import clsx from 'clsx'

const THEME_CYCLE: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' }
const THEME_ICON: Record<Theme, JSX.Element> = {
  auto:  <Monitor size={14} strokeWidth={1.75} />,
  light: <Sun     size={14} strokeWidth={1.75} />,
  dark:  <Moon    size={14} strokeWidth={1.75} />,
}
const THEME_LABEL: Record<Theme, string> = { auto: 'Automatisch', light: 'Hell', dark: 'Dunkel' }

const ROLE_LABEL_DE: Record<string, string> = {
  EMPLOYEE: 'Mitarbeiter',
  REVIEWER: 'Prüfer',
  INNOVATION_MANAGER: 'Innovationsmanager',
  SPONSOR: 'Sponsor',
  ADMIN: 'Administrator',
  SUPERADMIN: 'Super-Administrator',
}

export default function Layout() {
  const { user, clear } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Keep <html>.dark in sync with the store + OS preference.
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'auto') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('auto')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  if (!user) return null

  const can = (...roles: string[]) => roles.includes(user.role)

  const nav: { to: string; label: string; icon: JSX.Element; show: boolean }[] = [
    { to: '/',            label: 'Übersicht',   icon: <LayoutDashboard size={15} strokeWidth={1.75} />, show: true },
    { to: '/ideas',       label: 'Ideen',       icon: <ListChecks size={15} strokeWidth={1.75} />,       show: true },
    { to: '/campaigns',   label: 'Kampagnen',   icon: <Megaphone size={15} strokeWidth={1.75} />,        show: true },
    { to: '/graph',       label: 'Graph',       icon: <Network size={15} strokeWidth={1.75} />,          show: true },
    { to: '/leaderboard', label: 'Rangliste',   icon: <Trophy size={15} strokeWidth={1.75} />,           show: true },
    { to: '/submit',      label: 'Einreichen',  icon: <Pencil size={15} strokeWidth={1.75} />,           show: true },
    { to: '/workflow',    label: 'Workflow',    icon: <GitBranch size={15} strokeWidth={1.75} />,        show: can('INNOVATION_MANAGER','REVIEWER','SPONSOR','ADMIN','SUPERADMIN') },
    { to: '/settings',    label: 'Einstellungen', icon: <SettingsIcon size={15} strokeWidth={1.75} />,   show: true },
    { to: '/admin',       label: 'Admin',       icon: <Shield size={15} strokeWidth={1.75} />,           show: can('ADMIN','SUPERADMIN') },
  ]

  const sidebar = (
    <aside
      className={clsx(
        'w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col',
        'dark:border-slate-800 dark:bg-slate-950',
        'fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0',
        menuOpen ? 'translate-x-0 shadow-overlay' : '-translate-x-full md:translate-x-0',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 h-12 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-sm bg-slate-900 dark:bg-white grid place-items-center text-white dark:text-slate-900 text-[10px] font-bold tracking-tighter">G</div>
          <span className="font-semibold text-[13px] tracking-tight text-slate-900 dark:text-slate-100">geistesblitz</span>
        </div>
        <button
          className="btn-ghost md:hidden -mr-1.5"
          onClick={() => setMenuOpen(false)}
          title="Menü schließen"
        >
          <X size={16} />
        </button>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.filter((n) => n.show).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] font-medium transition',
                isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900',
              )
            }
          >
            {n.icon}
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
          <span className="text-slate-500 dark:text-slate-400 truncate">{user.tenantName}</span>
          <span className="font-mono uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1 py-px">
            {user.tenantPlan}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 truncate">{user.displayName}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{ROLE_LABEL_DE[user.role] ?? user.role}</div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              className="btn-ghost h-7 w-7 p-0"
              onClick={() => setTheme(THEME_CYCLE[theme])}
              title={`Design: ${THEME_LABEL[theme]} (zum Wechseln klicken)`}
            >
              {THEME_ICON[theme]}
            </button>
            <button
              className="btn-ghost h-7 w-7 p-0"
              onClick={() => { clear(); navigate('/login') }}
              title="Abmelden"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {sidebar}

      {menuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-2 px-3 h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <button
            className="btn-ghost"
            onClick={() => setMenuOpen(true)}
            title="Menü öffnen"
            aria-label="Menü öffnen"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-sm bg-slate-900 dark:bg-white grid place-items-center text-white dark:text-slate-900 text-[9px] font-bold">G</div>
            <span className="font-semibold text-[13px] tracking-tight text-slate-900 dark:text-slate-100">geistesblitz</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[6rem]">{user.displayName}</span>
        </header>

        <main className="flex-1 overflow-auto bg-white dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
