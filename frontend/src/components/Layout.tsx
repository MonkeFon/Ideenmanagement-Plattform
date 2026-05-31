import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { applyTheme, useTheme, type Theme } from '@/store/theme'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import GeistesblitzLogo from '@/components/GeistesblitzLogo'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { cn } from '@/lib/utils'
import { WORKFLOW_ROLES, ADMIN_ROLES, hasRole } from '@/lib/permissions'
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

  useKeyboardShortcuts()

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
    { to: '/workflow', label: 'Workflow',      icon: <GitBranch size={16} strokeWidth={1.75} />,   show: hasRole(user.role, WORKFLOW_ROLES) },
    { to: '/settings', label: 'Einstellungen', icon: <SettingsIcon size={16} strokeWidth={1.75} />, show: true },
    { to: '/admin',    label: 'Admin',         icon: <Shield size={16} strokeWidth={1.75} />,       show: hasRole(user.role, ADMIN_ROLES) },
  ]

  // Horizontal item for the top bar (≥xl).
  const renderTopItem = (n: NavItem) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors',
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

  // Vertical item for the mobile drop-down panel (<xl).
  const renderMenuItem = (n: NavItem) => (
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex items-center gap-3 h-14 px-3 md:px-4">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded bg-primary grid place-items-center text-primary-foreground shrink-0">
              <GeistesblitzLogo size={22} />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">geistesblitz</span>
            <div className="hidden xl:flex items-center gap-2 pl-3 ml-1 border-l border-border text-[11px]">
              <span className="text-muted-foreground truncate max-w-[10rem]" title={user.tenantName}>{user.tenantName}</span>
              <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase shrink-0 text-muted-foreground">
                {user.tenantPlan}
              </Badge>
            </div>
          </div>

          {/* Primary nav (desktop) */}
          <nav className="hidden xl:flex items-center gap-0.5 flex-1 min-w-0">
            {navWork.filter((n) => n.show).map(renderTopItem)}
            {navAdmin.some((n) => n.show) && <div className="mx-1.5 h-5 w-px bg-border shrink-0" aria-hidden />}
            {navAdmin.filter((n) => n.show).map(renderTopItem)}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <div className="hidden sm:block text-right min-w-0 mr-0.5">
              <div className="text-sm font-semibold text-foreground truncate max-w-[10rem]">{user.displayName}</div>
              <div className="hidden xl:block text-[12px] text-muted-foreground truncate leading-tight">{ROLE_LABEL_DE[user.role] ?? user.role}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(THEME_CYCLE[theme])}
              title={`Design: ${THEME_LABEL[theme]} (zum Wechseln klicken)`}
              aria-label={`Design wechseln (aktuell: ${THEME_LABEL[theme]})`}
            >
              {THEME_ICON[theme]}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden xl:inline-flex"
              onClick={() => { clear(); navigate('/login') }}
              title="Abmelden"
              aria-label="Abmelden"
            >
              <LogOut size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              title={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
              aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Collapsed nav (mobile / tablet) */}
        {menuOpen && (
          <div className="xl:hidden border-t border-border bg-background px-2 py-3 space-y-3 shadow-overlay">
            <div className="flex items-center justify-between gap-2 px-2.5 text-[11px]">
              <span className="text-muted-foreground truncate" title={user.tenantName}>{user.tenantName}</span>
              <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase shrink-0 text-muted-foreground">
                {user.tenantPlan}
              </Badge>
            </div>
            <div>
              <div className="px-2.5 mb-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">Arbeit</div>
              <div className="space-y-0.5">{navWork.filter((n) => n.show).map(renderMenuItem)}</div>
            </div>
            {navAdmin.some((n) => n.show) && (
              <div>
                <div className="px-2.5 mb-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70">Verwaltung</div>
                <div className="space-y-0.5">{navAdmin.filter((n) => n.show).map(renderMenuItem)}</div>
              </div>
            )}
            <div className="border-t border-border pt-3 flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{user.displayName}</div>
                <div className="text-[12px] text-muted-foreground truncate">{ROLE_LABEL_DE[user.role] ?? user.role}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => { clear(); navigate('/login') }}
                title="Abmelden"
                aria-label="Abmelden"
              >
                <LogOut size={16} /> Abmelden
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Backdrop closes the mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-14 z-30 bg-slate-900/40 xl:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  )
}
