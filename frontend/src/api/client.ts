import axios, { AxiosError } from 'axios'
import { useAuth } from '@/store/auth'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<any>) => {
    if (err.response?.status === 401) {
      useAuth.getState().clear()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
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
