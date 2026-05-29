import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'
import { useLocale } from '@/store/locale'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  // Tell the backend which dataset language to serve (English seed vs German translations).
  cfg.headers['X-Content-Lang'] = useLocale.getState().contentLang
  return cfg
})

/**
 * Global response interceptor. Two jobs:
 *
 *  1. 401 → clear the JWT, surface a single toast explaining the session expired,
 *     then redirect to /login. Previously the user got blank pages with no
 *     explanation when their 480-min JWT TTL ran out mid-session.
 *
 *  2. Convert every non-2xx into a toast unless the caller opts out by setting
 *     `config.meta.silent = true` on the request. This way every mutation in
 *     the app gets sensible failure feedback without needing per-call onError
 *     handlers. 402 (license) is left silent because callers render their own
 *     upgrade-hint UI via {@link asLicenseViolation}.
 */
api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ error?: string; message?: string; traceId?: string }>) => {
    const status = err.response?.status ?? 0
    const data = err.response?.data
    const config = err.config as (typeof err.config & { meta?: { silent?: boolean } }) | undefined
    const silent = config?.meta?.silent === true

    if (status === 401) {
      if (window.location.pathname !== '/login') {
        // Only show the "session expired" toast if we WERE authenticated — a 401 on the
        // login call itself is just a wrong-password error and the form handles it inline.
        if (useAuth.getState().token) {
          toast.error('Sitzung abgelaufen', {
            description: 'Bitte erneut anmelden, um fortzufahren.',
          })
        }
        useAuth.getState().clear()
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }

    if (status === 402) {
      // License violations are surfaced inline by the affected page (refine panel,
      // submit form, invite dialog) — no global toast.
      return Promise.reject(err)
    }

    if (!silent && status >= 400) {
      const title =
        status === 403 ? 'Keine Berechtigung'
        : status === 404 ? 'Nicht gefunden'
        : status === 409 ? 'Aktion nicht möglich'
        : status === 503 ? 'Dienst nicht verfügbar'
        : status >= 500 ? 'Server-Fehler'
        : 'Anfrage fehlgeschlagen'
      toast.error(title, {
        description: data?.message ?? err.message ?? 'Unbekannter Fehler',
      })
    } else if (!silent && status === 0) {
      // Network failure — no response at all.
      toast.error('Netzwerkfehler', {
        description: 'Server nicht erreichbar. Verbindung prüfen und erneut versuchen.',
      })
    }

    return Promise.reject(err)
  },
)

export interface LicenseViolation {
  reason: string
  message: string
}

export function asLicenseViolation(err: unknown): LicenseViolation | null {
  const e = err as AxiosError<{ reason?: string; message?: string }>
  if (e?.response?.status === 402) {
    return {
      reason: e.response.data?.reason ?? 'license_violation',
      message: e.response.data?.message ?? 'License limit reached',
    }
  }
  return null
}
