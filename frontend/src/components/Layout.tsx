import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { applyTheme, useTheme, type Theme } from '@/store/theme'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import GeistesblitzLogo from '@/components/GeistesblitzLogo'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ListChecks, Network, Trophy, Megaphone,
  Settings as SettingsIcon, Shield, GitBranch, LogOut, Pencil, Menu, X,
  Sun, Moon, Monitor,
} from 'lucide-react'

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

  type NavItem = { to: string; label: string; icon: JSX.Element; show: boolean }
  const navWork: NavItem[] = [
    { to: '/',            label: 'Übersicht',  icon: <LayoutDashboard size={16} strokeWidth={1.75} />, show: true },
    { to: '/ideas',       label: 'Ideen',      icon: <ListChecks size={16} strokeWidth={1.75} />,      show: true },
    { to: '/campaigns',   label: 'Kampagnen',  icon: <Megaphone size={16} strokeWidth={1.75} />,       show: true },
    { to: '/graph',       label: 'Graph',      icon: <Network size={16} strokeWidth={1.75} />,         show: true },
    { to: '/leaderboard', label: 'Rangliste',  icon: <Trophy size={16} strokeWidth={1.75} />,          show: true },
    { to: '/submit',      label: 'Einreichen', icon: <Pencil size={16} strokeWidth={1.75} />,          show: true },
  ]
  const navAdmin: NavItem[] = [
    { to: '/workflow', label: 'Workflow',      icon: <GitBranch size={16} strokeWidth={1.75} />,   show: can('INNOVATION_MANAGER','REVIEWER','SPONSOR','ADMIN','SUPERADMIN') },
    { to: '/settings', label: 'Einstellungen', icon: <SettingsIcon size={16} strokeWidth={1.75} />, show: true },
    { to: '/admin',    label: 'Admin',         icon: <Shield size={16} strokeWidth={1.75} />,       show: can('ADMIN','SUPERADMIN') },
  ]

  const renderItem = (n: NavItem) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        )
      }
    >
      {n.icon}
      {n.label}
    </NavLink>
  )

  const sidebar = (
    <aside
      className={cn(
        'w-56 shrink-0 border-r border-border bg-background flex flex-col',
        'fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0',
        menuOpen ? 'translate-x-0 shadow-overlay' : '-translate-x-full md:translate-x-0',
      )}
    >
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary grid place-items-center text-primary-foreground shrink-0">
              <GeistesblitzLogo size={22} />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">geistesblitz</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -mr-1.5"
            onClick={() => setMenuOpen(false)}
            title="Menü schließen"
          >
            <X size={16} />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-muted-foreground truncate" title={user.tenantName}>{user.tenantName}</span>
          <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase shrink-0 text-muted-foreground">
            {user.tenantPlan}
          </Badge>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        <div>
          <div className="px-2.5 mb-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">Arbeit</div>
          <div className="space-y-0.5">{navWork.filter((n) => n.show).map(renderItem)}</div>
        </div>
        {navAdmin.some((n) => n.show) && (
          <div>
            <div className="px-2.5 mb-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">Verwaltung</div>
            <div className="space-y-0.5">{navAdmin.filter((n) => n.show).map(renderItem)}</div>
          </div>
        )}
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{user.displayName}</div>
            <div className="text-[12px] text-muted-foreground truncate">{ROLE_LABEL_DE[user.role] ?? user.role}</div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(THEME_CYCLE[theme])}
              title={`Design: ${THEME_LABEL[theme]} (zum Wechseln klicken)`}
            >
              {THEME_ICON[theme]}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { clear(); navigate('/login') }}
              title="Abmelden"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen flex bg-background">
      {sidebar}

      {menuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-2 px-3 h-14 border-b border-border bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            title="Menü öffnen"
            aria-label="Menü öffnen"
          >
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary grid place-items-center text-primary-foreground shrink-0">
              <GeistesblitzLogo size={20} />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">geistesblitz</span>
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[8rem]">{user.displayName}</span>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
