import { useQueryClient } from '@tanstack/react-query'
import { useTheme, type Theme } from '@/store/theme'
import { useLocale, type ContentLang } from '@/store/locale'
import { useAuth } from '@/store/auth'
import { Sun, Moon, Monitor, Check, Languages } from 'lucide-react'

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
    preview: 'bg-gradient-to-r from-white to-slate-950 border-slate-300 dark:border-slate-700',
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
    <div className="p-4 md:p-8 max-w-3xl space-y-6">
      <header>
        <div className="eyebrow">Präferenzen</div>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Einstellungen</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
          Persönliche Einstellungen für Ihr Konto bei {user.tenantName}.
        </p>
      </header>

      <section className="card p-4 md:p-5 space-y-4">
        <div>
          <div className="eyebrow">Erscheinungsbild</div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
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
                className={`relative cursor-pointer rounded border p-3 transition ${
                  selected
                    ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
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
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    {opt.icon}
                    <span className="font-medium text-[13px]">{opt.label}</span>
                  </div>
                  {selected && <Check size={14} strokeWidth={2} className="text-slate-900 dark:text-slate-100" />}
                </div>
                <div className={`mt-2.5 h-14 rounded border ${opt.preview}`} aria-hidden />
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{opt.description}</p>
              </label>
            )
          })}
        </fieldset>
      </section>

      <section className="card p-4 md:p-5 space-y-4">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <Languages size={12} strokeWidth={2} className="text-slate-500 dark:text-slate-400" />
            Inhaltssprache
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
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
                className={`relative cursor-pointer rounded border p-3 transition ${
                  selected
                    ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
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
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <span className="font-mono uppercase tracking-wider text-[10px] border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5">
                      {opt.value}
                    </span>
                    <span className="font-medium text-[13px]">{opt.label}</span>
                  </div>
                  {selected && <Check size={14} strokeWidth={2} className="text-slate-900 dark:text-slate-100" />}
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{opt.description}</p>
              </label>
            )
          })}
        </fieldset>
      </section>

      <section className="card p-4 md:p-5">
        <div className="eyebrow">Konto</div>
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-[13px]">
          <dt className="text-slate-500 dark:text-slate-400">Name</dt>
          <dd className="text-slate-900 dark:text-slate-100 font-medium">{user.displayName}</dd>

          <dt className="text-slate-500 dark:text-slate-400">E-Mail</dt>
          <dd className="text-slate-900 dark:text-slate-100 font-mono text-[12px]">{user.email}</dd>

          <dt className="text-slate-500 dark:text-slate-400">Rolle</dt>
          <dd className="text-slate-900 dark:text-slate-100">
            <span className="font-mono text-[10px] uppercase tracking-wider border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
              {user.role.replaceAll('_', ' ').toLowerCase()}
            </span>
          </dd>

          <dt className="text-slate-500 dark:text-slate-400">Mandant</dt>
          <dd className="text-slate-900 dark:text-slate-100">
            {user.tenantName}
            <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1 py-px">
              {user.tenantPlan}
            </span>
          </dd>
        </dl>
        <p className="mt-4 text-[12px] text-slate-500 dark:text-slate-400">
          Für Änderungen an Name, E-Mail oder Rolle wenden Sie sich bitte an Ihren Mandanten-Administrator.
        </p>
      </section>
    </div>
  )
}
