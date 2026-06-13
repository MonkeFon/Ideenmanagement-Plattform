import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTheme, type Theme } from '@/store/theme'
import { useAuth } from '@/store/auth'
import { AuthApi, SubscriptionApi } from '@/api/endpoints'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/Spinner'
import { cn } from '@/lib/utils'
import GeistesblitzLogo from '@/components/GeistesblitzLogo'
import { Sun, Moon, Monitor, Check, Info, LogOut, Sparkles, ArrowUp } from 'lucide-react'
import type { PlanOption } from '@/types/api'

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

const ROLE_LABEL_DE: Record<string, string> = {
  EMPLOYEE: 'Mitarbeiter',
  REVIEWER: 'Prüfer',
  INNOVATION_MANAGER: 'Innovationsmanager',
  SPONSOR: 'Sponsor',
  ADMIN: 'Administrator',
  SUPERADMIN: 'Super-Administrator',
}

// Human-readable labels for the plan feature flags.
const FEATURE_LABEL: Record<string, string> = {
  rag_refine: 'KI-Verfeinerung & Chat',
  sso: 'Single Sign-On (SSO)',
  custom_wf: 'Anpassbarer Workflow',
}

const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN']

export default function Settings() {
  const user = useAuth((s) => s.user)!
  const clear = useAuth((s) => s.clear)
  const setUser = useAuth((s) => s.setUser)
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const isAdmin = ADMIN_ROLES.includes(user.role)

  const plansQ = useQuery({ queryKey: ['plans'], queryFn: () => SubscriptionApi.plans() })

  const changePlan = useMutation({
    mutationFn: (code: string) => SubscriptionApi.changePlan(code),
    onSuccess: async (usage) => {
      toast.success('Tarif geändert', { description: `Ihr Mandant nutzt jetzt den Tarif „${usage.planName}".` })
      qc.invalidateQueries({ queryKey: ['plans'] })
      // Refresh the cached profile so the plan badge in the header/account updates immediately.
      try { setUser(await AuthApi.me()) } catch { /* interceptor handles auth errors */ }
    },
    onError: (err: any) => {
      toast.error('Tarifwechsel fehlgeschlagen', {
        description: err?.response?.data?.message ?? 'Bitte erneut versuchen.',
      })
    },
  })

  const initials = user.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-6">
      <header>
        <div className="eyebrow">Präferenzen</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Einstellungen</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Persönliche Einstellungen für Ihr Konto bei {user.tenantName}.
        </p>
      </header>

      {/* Account + About sit side-by-side and balance each other out. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 md:p-5 space-y-4">
          <div className="eyebrow">Konto</div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold text-base shrink-0" aria-hidden>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-foreground font-semibold tracking-tight truncate">{user.displayName}</div>
              <div className="text-[13px] text-muted-foreground font-mono truncate">{user.email}</div>
            </div>
          </div>

          <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2.5 text-sm border-t border-border pt-4">
            <dt className="text-muted-foreground">Rolle</dt>
            <dd className="text-foreground">
              <Badge variant="outline" className="font-medium">
                {ROLE_LABEL_DE[user.role] ?? user.role.replaceAll('_', ' ').toLowerCase()}
              </Badge>
            </dd>

            <dt className="text-muted-foreground">Mandant</dt>
            <dd className="text-foreground inline-flex items-center gap-2 flex-wrap">
              {user.tenantName}
              <Badge variant="outline" className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground">
                {user.tenantPlan}
              </Badge>
            </dd>
          </dl>

          <p className="text-[12px] text-muted-foreground">
            Für Änderungen an Name, E-Mail oder Rolle wenden Sie sich bitte an Ihren Mandanten-Administrator.
          </p>

          <div className="border-t border-border pt-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => { clear(); navigate('/login') }}
            >
              <LogOut size={15} strokeWidth={1.75} />
              Abmelden
            </Button>
          </div>
        </Card>

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

      {/* Subscription / plan upgrade */}
      <Card className="p-4 md:p-5 space-y-4">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <Sparkles size={12} strokeWidth={2} className="text-muted-foreground" />
            Abonnement
          </div>
          <p className="text-[13px] text-muted-foreground mt-1">
            {isAdmin
              ? 'Wählen Sie den passenden Tarif für Ihren Mandanten. Höhere Tarife schalten zusätzliche Funktionen frei.'
              : 'Der aktuelle Tarif Ihres Mandanten. Tarifwechsel sind Administrator:innen vorbehalten.'}
          </p>
        </div>

        {plansQ.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-44 rounded border border-border bg-muted/40 animate-pulse" />)}
          </div>
        ) : plansQ.error ? (
          <p className="text-[13px] text-destructive">Tarife konnten nicht geladen werden.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(plansQ.data ?? []).map((plan) => (
              <PlanCard
                key={plan.code}
                plan={plan}
                isAdmin={isAdmin}
                pending={changePlan.isPending && changePlan.variables === plan.code}
                disabledAll={changePlan.isPending}
                onChoose={() => changePlan.mutate(plan.code)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Appearance lives at the bottom — least-changed setting, lowest priority. */}
      <Card className="p-4 md:p-5 space-y-4">
        <div>
          <div className="eyebrow">Erscheinungsbild</div>
          <p className="text-[13px] text-muted-foreground mt-1">
            Wählen Sie das Aussehen der Oberfläche. Die Einstellung wird nur in diesem Browser gespeichert.
          </p>
        </div>

        <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
    </div>
  )
}

function PlanCard({
  plan, isAdmin, pending, disabledAll, onChoose,
}: {
  plan: PlanOption
  isAdmin: boolean
  pending: boolean
  disabledAll: boolean
  onChoose: () => void
}) {
  // Free is genuinely free; Enterprise is priced 0 in the seed but is a sales tier,
  // so it reads "Auf Anfrage" rather than the misleading "Kostenlos".
  const price = plan.priceEur > 0
    ? `${plan.priceEur.toLocaleString('de-DE', { minimumFractionDigits: 0 })} € / Monat`
    : plan.code === 'FREE'
      ? 'Kostenlos'
      : 'Auf Anfrage'

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border p-4 transition-colors',
        plan.current ? 'border-foreground bg-muted/40' : 'border-input',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground tracking-tight">{plan.displayName}</span>
        {plan.current && <Badge variant="green" className="shrink-0">Aktiv</Badge>}
      </div>

      <div className="mt-1.5 text-[15px] font-semibold text-foreground tabular-nums">{price}</div>

      <ul className="mt-3 space-y-1.5 text-[12px] text-muted-foreground flex-1">
        <li className="flex items-center gap-1.5">
          <Check size={13} className="text-foreground/70 shrink-0" />
          {plan.seatLimit != null ? `Bis zu ${plan.seatLimit} Mitglieder` : 'Unbegrenzte Mitglieder'}
        </li>
        <li className="flex items-center gap-1.5">
          <Check size={13} className="text-foreground/70 shrink-0" />
          {plan.ideaLimit != null ? `${plan.ideaLimit} Ideen / Monat` : 'Unbegrenzte Ideen'}
        </li>
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-1.5">
            <Check size={13} className="text-foreground/70 shrink-0" />
            {FEATURE_LABEL[f] ?? f}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        {plan.current ? (
          <Button variant="outline" className="w-full" disabled>Aktueller Tarif</Button>
        ) : isAdmin ? (
          <Button className="w-full gap-1.5" onClick={onChoose} disabled={disabledAll}>
            {pending ? <><Spinner size={12} className="text-current" /> Wird gewechselt…</> : <><ArrowUp size={14} strokeWidth={2} /> Wechseln</>}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled title="Tarifwechsel sind Administrator:innen vorbehalten">
            Nur durch Admin
          </Button>
        )}
      </div>
    </div>
  )
}
