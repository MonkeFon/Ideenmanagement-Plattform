import { useQueryClient } from '@tanstack/react-query'
import { useTheme, type Theme } from '@/store/theme'
import { useLocale, type ContentLang } from '@/store/locale'
import { useAuth } from '@/store/auth'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import GeistesblitzLogo from '@/components/GeistesblitzLogo'
import { Sun, Moon, Monitor, Check, Languages, Keyboard, Info } from 'lucide-react'

const THEME_OPTIONS: { value: Theme; label: string; description: string; icon: JSX.Element; preview: string }[] = [
  {
    value: 'light',
    label: 'Hell',
    description: 'Weiße Flächen mit dunklem Text. Empfehlenswert für Beamer und gut beleuchtete Räume.',
    icon: <Sun size={16} strokeWidth={1.75} />,
    preview: 'bg-white border-slate-200',
  },
  {
    value: 'dark',
    label: 'Dunkel',
    description: 'Fast schwarze Flächen mit hellem Text. Angenehmer bei wenig Licht.',
    icon: <Moon size={16} strokeWidth={1.75} />,
    preview: 'bg-slate-950 border-slate-800',
  },
  {
    value: 'auto',
    label: 'Automatisch',
    description: 'Folgt der Einstellung Ihres Betriebssystems und wechselt mit ihr.',
    icon: <Monitor size={16} strokeWidth={1.75} />,
    preview: 'bg-gradient-to-r from-white to-slate-950 border-input',
  },
]

const CONTENT_LANG_OPTIONS: { value: ContentLang; label: string; description: string }[] = [
  {
    value: 'en',
    label: 'Englisch',
    description: 'Originaldaten der Plattform — alle eingereichten Ideen und Kampagnen in ihrer ursprünglichen Sprache.',
  },
  {
    value: 'de',
    label: 'Deutsch',
    description: 'Deutsche Übersetzungen der vorhandenen Beispiel-Ideen und -Kampagnen. Selbst eingereichte Inhalte bleiben unverändert.',
  },
]

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['G', 'H'], label: 'Zur Übersicht' },
  { keys: ['G', 'I'], label: 'Zur Ideenliste' },
  { keys: ['G', 'K'], label: 'Zu den Kampagnen' },
  { keys: ['G', 'G'], label: 'Zum Graph' },
  { keys: ['G', 'L'], label: 'Zur Rangliste' },
  { keys: ['N'],      label: 'Neue Idee einreichen' },
  { keys: ['/'],      label: 'Suchfeld fokussieren' },
  { keys: ['?'],      label: 'Diese Übersicht anzeigen' },
]

export default function Settings() {
  const user = useAuth((s) => s.user)!
  const qc = useQueryClient()
  const { theme, setTheme } = useTheme()
  const { contentLang, setContentLang } = useLocale()

  function changeContentLang(next: ContentLang) {
    if (next === contentLang) return
    setContentLang(next)
    // Force every cached query to refetch with the new X-Content-Lang header
    // so the visible idea/campaign content swaps immediately.
    qc.invalidateQueries()
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-6">
      <header>
        <div className="eyebrow">Präferenzen</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Einstellungen</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Persönliche Einstellungen für Ihr Konto bei {user.tenantName}.
        </p>
      </header>

      {/* Theme + Content language sit side-by-side on lg+ so neither card spans
          the full page width and the right column never reads as empty. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 md:p-5 space-y-4">
          <div>
            <div className="eyebrow">Erscheinungsbild</div>
            <p className="text-[13px] text-muted-foreground mt-1">
              Wählen Sie das Aussehen der Oberfläche. Die Einstellung wird nur in diesem Browser gespeichert.
            </p>
          </div>

          <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <legend className="sr-only">Design</legend>
            {THEME_OPTIONS.map((opt) => {
              const selected = theme === opt.value
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'relative cursor-pointer rounded border p-3 transition-colors',
                    selected
                      ? 'border-foreground bg-muted/50'
                      : 'border-input hover:border-foreground/30',
                  )}
                >
                  <input
                    type="radio"
                    name="design"
                    value={opt.value}
                    checked={selected}
                    onChange={() => setTheme(opt.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground">
                      {opt.icon}
                      <span className="font-medium text-[13px]">{opt.label}</span>
                    </div>
                    {selected && <Check size={14} strokeWidth={2} className="text-foreground" />}
                  </div>
                  <div className={`mt-2.5 h-14 rounded border ${opt.preview}`} aria-hidden />
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{opt.description}</p>
                </label>
              )
            })}
          </fieldset>
        </Card>

        <Card className="p-4 md:p-5 space-y-4">
          <div>
            <div className="eyebrow flex items-center gap-2">
              <Languages size={12} strokeWidth={2} className="text-muted-foreground" />
              Inhaltssprache
            </div>
            <p className="text-[13px] text-muted-foreground mt-1">
              Welche Sprache soll für vorhandene Ideen und Kampagnen geladen werden? Selbst eingereichte
              Inhalte werden nicht übersetzt.
            </p>
          </div>

          <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <legend className="sr-only">Inhaltssprache</legend>
            {CONTENT_LANG_OPTIONS.map((opt) => {
              const selected = contentLang === opt.value
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'relative cursor-pointer rounded border p-3 transition-colors',
                    selected
                      ? 'border-foreground bg-muted/50'
                      : 'border-input hover:border-foreground/30',
                  )}
                >
                  <input
                    type="radio"
                    name="content-lang"
                    value={opt.value}
                    checked={selected}
                    onChange={() => changeContentLang(opt.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground">
                      <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase">
                        {opt.value}
                      </Badge>
                      <span className="font-medium text-[13px]">{opt.label}</span>
                    </div>
                    {selected && <Check size={14} strokeWidth={2} className="text-foreground" />}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{opt.description}</p>
                </label>
              )
            })}
          </fieldset>
        </Card>
      </div>

      {/* Account + side-by-side helpers below: keyboard reference + about-the-platform. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 md:p-5 lg:col-span-2">
          <div className="eyebrow">Konto</div>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-foreground font-medium">{user.displayName}</dd>

            <dt className="text-muted-foreground">E-Mail</dt>
            <dd className="text-foreground font-mono text-[13px]">{user.email}</dd>

            <dt className="text-muted-foreground">Rolle</dt>
            <dd className="text-foreground">
              <Badge variant="outline" className="font-mono text-[11px] tracking-wider uppercase">
                {user.role.replaceAll('_', ' ').toLowerCase()}
              </Badge>
            </dd>

            <dt className="text-muted-foreground">Mandant</dt>
            <dd className="text-foreground inline-flex items-center gap-2">
              {user.tenantName}
              <Badge variant="outline" className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground">
                {user.tenantPlan}
              </Badge>
            </dd>
          </dl>
          <p className="mt-4 text-[12px] text-muted-foreground">
            Für Änderungen an Name, E-Mail oder Rolle wenden Sie sich bitte an Ihren Mandanten-Administrator.
          </p>
        </Card>

        <Card className="p-4 md:p-5 space-y-3">
          <div className="eyebrow flex items-center gap-2">
            <Keyboard size={12} strokeWidth={2} className="text-muted-foreground" />
            Tastenkürzel
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Schnellnavigation aus jeder Seite. Tastenkombinationen werden mit{' '}
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase px-1.5 py-0">G</Badge>{' '}
            eingeleitet (z.&nbsp;B. <span className="font-mono text-foreground">G I</span> für Ideen).
          </p>
          <ul className="space-y-1.5">
            {SHORTCUTS.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-muted-foreground truncate">{s.label}</span>
                <span className="flex items-center gap-0.5 shrink-0">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="font-mono text-[10px] uppercase tracking-wider border border-input rounded bg-muted px-1.5 py-0.5 text-foreground"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground/70">
            Tastenkürzel sind in jeder Seite aktiv — außer während der Texteingabe.
            <span className="ml-1">Drücken Sie <kbd className="font-mono text-[10px] uppercase tracking-wider border border-input rounded bg-muted px-1 py-px text-foreground">?</kbd> jederzeit, um diese Übersicht zu öffnen.</span>
          </p>
        </Card>
      </div>

      <Card className="p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
          <div>
            <div className="eyebrow flex items-center gap-2">
              <Info size={12} strokeWidth={2} className="text-muted-foreground" />
              Über Geistesblitz
            </div>
            <p className="mt-2 text-[13px] text-foreground/90 leading-relaxed max-w-prose">
              Prototyp einer mandantenfähigen Ideenmanagement-Plattform. Eingereichte Ideen
              durchlaufen einen rollenbasierten Workflow vom Entwurf bis zur Umsetzung;
              semantische Suche und KI-Verfeinerung helfen, Duplikate zu erkennen und
              Vorschläge zu schärfen.
            </p>
            <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-x-4 gap-y-1 text-[12px]">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="text-foreground font-mono">v0.1.0 · prototype</dd>
              <dt className="text-muted-foreground">Lizenz</dt>
              <dd className="text-foreground">Interner Prototyp · nicht für Produktion</dd>
            </dl>
          </div>
          <div className="hidden md:flex h-16 w-16 rounded bg-primary text-primary-foreground items-center justify-center shrink-0">
            <GeistesblitzLogo size={44} />
          </div>
        </div>
      </Card>
    </div>
  )
}
