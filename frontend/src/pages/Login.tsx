import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthApi } from '@/api/endpoints'
import { useAuth } from '@/store/auth'
import Spinner from '@/components/Spinner'

const DEMO = [
  { email: 'admin@acme.test',    role: 'Administrator' },
  { email: 'sponsor@acme.test',  role: 'Sponsor' },
  { email: 'manager@acme.test',  role: 'Innovationsmanager' },
  { email: 'reviewer@acme.test', role: 'Prüfer' },
  { email: 'alice@acme.test',    role: 'Mitarbeiter' },
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <header className="px-6 h-12 flex items-center border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-sm bg-slate-900 dark:bg-white grid place-items-center text-white dark:text-slate-900 text-[10px] font-bold tracking-tighter">G</div>
          <span className="font-semibold text-[13px] tracking-tight text-slate-900 dark:text-slate-100">geistesblitz</span>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1fr_400px]">
        <section className="hidden lg:flex flex-col justify-center px-12 xl:px-20 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="eyebrow">Ideenmanagement für Unternehmen</div>
          <h1 className="mt-3 text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-tight max-w-lg">
            Heben Sie die Ideen, die schon in Ihrem Unternehmen schlummern.
          </h1>
          <p className="mt-4 text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
            Einreichen, abstimmen, bewerten, umsetzen — mit semantischer Suche, damit kein Kontext aus früheren Vorschlägen verloren geht.
          </p>
          <ul className="mt-8 space-y-2 text-[13px] text-slate-600 dark:text-slate-300 max-w-md">
            <li className="flex gap-2.5"><span className="text-slate-400 dark:text-slate-500 font-mono">01</span> Rollenbasierter Workflow vom Entwurf bis zur Umsetzung</li>
            <li className="flex gap-2.5"><span className="text-slate-400 dark:text-slate-500 font-mono">02</span> Zusammengesetzter Prioritäts-Score</li>
            <li className="flex gap-2.5"><span className="text-slate-400 dark:text-slate-500 font-mono">03</span> RAG-gestützte Verfeinerung &amp; Duplikaterkennung</li>
          </ul>
          <div className="mt-10 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">Prototyp · v0.1</div>
        </section>

        <section className="flex items-center justify-center p-8">
          <form onSubmit={submit} className="w-full max-w-sm space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Anmelden</h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Nutzen Sie ein Demo-Konto, um den Prototyp auszuprobieren.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">E-Mail</label>
                <input className="input mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Passwort</label>
                <input className="input mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            {error && <div className="text-[13px] text-rose-600 dark:text-rose-400">{error}</div>}

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? <><Spinner size={12} className="text-current" /> Anmeldung läuft…</> : 'Anmelden'}
            </button>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="eyebrow">Demo-Konten</div>
                <span className="font-mono text-[10px] tracking-wider text-slate-500 dark:text-slate-400">demo1234</span>
              </div>
              <div className="space-y-px">
                {DEMO.map((d) => (
                  <button
                    type="button"
                    key={d.email}
                    className="w-full flex justify-between text-left rounded px-2 py-1.5 text-[12px] hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    onClick={() => { setEmail(d.email); setPassword('demo1234') }}
                  >
                    <span className="font-mono text-slate-700 dark:text-slate-300">{d.email}</span>
                    <span className="text-slate-400 dark:text-slate-500">{d.role}</span>
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
