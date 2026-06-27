import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthApi } from '@/api/endpoints'
import { useAuth } from '@/store/auth'
import Spinner from '@/components/Spinner'
import GeistesblitzLogo from '@/components/GeistesblitzLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GitBranch, BarChart3, Sparkles } from 'lucide-react'

// Ordered by organisational hierarchy, lowest privilege first:
// Mitarbeiter → Ideenmanager → Prüfer → Sponsor → Administrator.
const DEMO = [
    { email: 'timo@fom.de',    role: 'Mitarbeiter' },
  { email: 'lifon@fom.de',   role: 'Ideenmanager' },
  { email: 'jan@fom.de',     role: 'Prüfer' },
    { email: 'michel@fom.de',  role: 'Sponsor' },
  { email: 'michael@fom.de', role: 'Administrator' },
]

// Marketing highlights on the hero panel.
const FEATURES = [
  { icon: GitBranch, title: 'Rollenbasierter Workflow', body: 'Mitarbeiter, Sponsoren, Prüfer und Ideenmanager' },
  { icon: BarChart3, title: 'Zusammengesetzte Bewertung', body: 'Wirkung, Machbarkeit und Strategic Fit bestimmen die Priorität.' },
  { icon: Sparkles,  title: 'KI-gestützte Verfeinerung', body: 'Semantische Suche und Duplikatserkennung machen Ideen auffindbar und vermeiden Redundanzen.' },
]

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuth((s) => s.setAuth)
  const [email, setEmail] = useState('lifon@fom.de')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { document.title = 'Anmelden · Geistesblitz' }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const res = await AuthApi.login(email, password)
      setAuth(res.token, res.user)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Anmeldung fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* ───────────── Hero panel (desktop only) — permanently dark for a premium feel ───────────── */}
      <section className="relative hidden lg:flex lg:flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b2521] via-[#0a1815] to-[#050e0d] text-white p-12 xl:p-16 lg:border-r border-white/10">
        {/* Fine grid texture, faded toward the edges */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),' +
              'linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 100% 95% at 50% 30%, black 55%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 95% at 50% 30%, black 55%, transparent 100%)',
          }}
          aria-hidden
        />
        {/* Soft colour glows — restrained, the only hint of hue on a monochrome brand */}
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-[#239F91]/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#2dd4bf]/15 blur-3xl" aria-hidden />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg bg-primary grid place-items-center text-primary-foreground ring-1 ring-white/10 shrink-0"
            style={{ '--primary': '35 159 145' } as React.CSSProperties}
          >
            <GeistesblitzLogo size={28} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Geistesblitz</span>
        </div>

        {/* Hero copy + features */}
        <div className="relative z-10 max-w-lg">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6fd3c6]">
            Ideenmanagement für Unternehmen
          </div>
          <h1 className="mt-4 text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.08]">
            Vom Geistesblitz zur Handlung
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-300/90 max-w-md">
            Einreichen, abstimmen, bewerten, umsetzen mit KI-Unterstützung damit keine Ideen verloren gehen.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3.5">
                <div className="h-9 w-9 rounded-lg bg-[#239F91]/15 border border-[#239F91]/30 grid place-items-center shrink-0">
                  <f.icon size={17} strokeWidth={1.75} className="text-[#6fd3c6]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{f.title}</div>
                  <div className="text-[13px] leading-snug text-slate-400">{f.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[11px] uppercase tracking-wider text-slate-500 font-mono">
          Prototyp · v0.1
        </div>
      </section>

      {/* ───────────── Form panel ───────────── */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Brand (shown only when the hero panel is hidden) */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div
              className="h-9 w-9 rounded bg-primary grid place-items-center text-primary-foreground shrink-0"
              style={{ '--primary': '35 159 145' } as React.CSSProperties}
            >
              <GeistesblitzLogo size={26} />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">Geistesblitz</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Willkommen zurück</h2>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              Nutzen Sie ein Demo-Konto, um den Prototyp auszuprobieren.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-3">
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" className="mt-1.5 focus-visible:ring-[#239F91]" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Passwort</Label>
                <Input id="password" className="mt-1.5 focus-visible:ring-[#239F91]" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {error && <div className="text-[13px] text-destructive">{error}</div>}

            <Button className="w-full bg-[#239F91] text-white hover:bg-[#1d8478]" disabled={busy}>
              {busy ? <><Spinner size={12} className="text-current" /> Anmeldung läuft…</> : 'Anmelden'}
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="eyebrow">Demo-Konten</div>
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted">demo1234</span>
            </div>
            <div className="space-y-px">
              {DEMO.map((d) => (
                <button
                  type="button"
                  key={d.email}
                  className="group w-full flex items-center justify-between text-left rounded-md px-2.5 py-2 text-[12px] hover:bg-accent transition-colors"
                  onClick={() => { setEmail(d.email); setPassword('demo1234') }}
                >
                  <span className="font-mono text-foreground/90 group-hover:text-foreground transition-colors">{d.email}</span>
                  <span className="text-muted-foreground/70">{d.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <span aria-hidden>·</span>
            <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
