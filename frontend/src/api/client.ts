import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ error?: string; message?: string; traceId?: string }>) => {
    const status = err.response?.status ?? 0
    const data = err.response?.data
    const config = err.config as (typeof err.config & { meta?: { silent?: boolean } }) | undefined
    const silent = config?.meta?.silent === true

    if (status === 401) {
      if (window.location.pathname !== '/login') {

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
