import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthApi } from '@/api/endpoints'
import { useAuth } from '@/store/auth'
import Spinner from '@/components/Spinner'
import GeistesblitzLogo from '@/components/GeistesblitzLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Ordered by organisational hierarchy, lowest privilege first:
// Mitarbeiter → Innovationsmanager → Prüfer → Sponsor → Administrator.
const DEMO = [
  { email: 'alice@acme.test',    role: 'Mitarbeiter' },
  { email: 'manager@acme.test',  role: 'Innovationsmanager' },
  { email: 'reviewer@acme.test', role: 'Prüfer' },
  { email: 'sponsor@acme.test',  role: 'Sponsor' },
  { email: 'admin@acme.test',    role: 'Administrator' },
]

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuth((s) => s.setAuth)
  const [email, setEmail] = useState('alice@acme.test')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 h-14 flex items-center border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded bg-primary grid place-items-center text-primary-foreground shrink-0">
            <GeistesblitzLogo size={26} />
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">geistesblitz</span>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1fr_400px]">
        <section className="hidden lg:flex flex-col justify-center px-12 xl:px-20 border-r border-border bg-muted">
          <div className="eyebrow">Ideenmanagement für Unternehmen</div>
          <h1 className="mt-3 text-3xl xl:text-4xl font-semibold text-foreground tracking-tight leading-tight max-w-lg">
            Heben Sie die Ideen, die schon in Ihrem Unternehmen schlummern.
          </h1>
          <p className="mt-4 text-[14px] text-muted-foreground leading-relaxed max-w-md">
            Einreichen, abstimmen, bewerten, umsetzen — mit semantischer Suche, damit kein Kontext aus früheren Vorschlägen verloren geht.
          </p>
          <ul className="mt-8 space-y-2 text-[13px] text-slate-600 dark:text-slate-300 max-w-md">
            <li className="flex gap-2.5"><span className="text-muted-foreground/70 font-mono">01</span> Rollenbasierter Workflow vom Entwurf bis zur Umsetzung</li>
            <li className="flex gap-2.5"><span className="text-muted-foreground/70 font-mono">02</span> Zusammengesetzter Prioritäts-Score</li>
            <li className="flex gap-2.5"><span className="text-muted-foreground/70 font-mono">03</span> RAG-gestützte Verfeinerung &amp; Duplikaterkennung</li>
          </ul>
          <div className="mt-10 text-[11px] uppercase tracking-wider text-muted-foreground/70 font-mono">Prototyp · v0.1</div>
        </section>

        <section className="flex items-center justify-center p-8">
          <form onSubmit={submit} className="w-full max-w-sm space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Anmelden</h2>
              <p className="text-[13px] text-muted-foreground mt-1">Nutzen Sie ein Demo-Konto, um den Prototyp auszuprobieren.</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Passwort</Label>
                <Input id="password" className="mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {error && <div className="text-[13px] text-destructive">{error}</div>}

            <Button className="w-full" disabled={busy}>
              {busy ? <><Spinner size={12} className="text-current" /> Anmeldung läuft…</> : 'Anmelden'}
            </Button>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="eyebrow">Demo-Konten</div>
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground">demo1234</span>
              </div>
              <div className="space-y-px">
                {DEMO.map((d) => (
                  <button
                    type="button"
                    key={d.email}
                    className="w-full flex justify-between text-left rounded px-2 py-1.5 text-[12px] hover:bg-muted transition-colors"
                    onClick={() => { setEmail(d.email); setPassword('demo1234') }}
                  >
                    <span className="font-mono text-foreground/90">{d.email}</span>
                    <span className="text-muted-foreground/70">{d.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
