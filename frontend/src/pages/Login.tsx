import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthApi } from '@/api/endpoints'
import { useAuth } from '@/store/auth'
import { Lightbulb } from 'lucide-react'

const DEMO = [
  { email: 'admin@acme.test',    role: 'Admin' },
  { email: 'sponsor@acme.test',  role: 'Sponsor' },
  { email: 'manager@acme.test',  role: 'Innovation Manager' },
  { email: 'reviewer@acme.test', role: 'Reviewer' },
  { email: 'alice@acme.test',    role: 'Employee' },
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
      setError(err?.response?.data?.message ?? 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-12">
        <div className="flex items-center gap-2">
          <Lightbulb size={26} /> <span className="text-xl font-semibold tracking-tight">Geistesblitz</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight">
            Capture the ideas already inside your company.
          </h1>
          <p className="mt-4 text-brand-100 max-w-md">
            Submit, vote, evaluate, and ship — with semantic search so you never lose context from
            previous proposals.
          </p>
          <ul className="mt-8 space-y-2 text-brand-100 text-sm">
            <li>✓ Role-aware workflow from draft to delivery</li>
            <li>✓ Composite priority scoring</li>
            <li>✓ RAG-powered idea refinement & duplicate detection</li>
          </ul>
        </div>
        <div className="text-xs text-brand-200">Prototype · v0.1</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Use a demo account to explore the prototype.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="card p-4 text-xs text-slate-600">
            <div className="label mb-2">Demo accounts (password <code>demo1234</code>)</div>
            <div className="space-y-1">
              {DEMO.map((d) => (
                <button
                  type="button"
                  key={d.email}
                  className="w-full flex justify-between text-left rounded px-2 py-1 hover:bg-slate-50"
                  onClick={() => { setEmail(d.email); setPassword('demo1234') }}
                >
                  <span>{d.email}</span><span className="text-slate-400">{d.role}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
