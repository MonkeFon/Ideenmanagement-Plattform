import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/lib/env';
import { useAuthStore } from '@/stores/authStore';
import { ENDPOINTS } from './endpoints';
import type { ApiEnvelope, AuthResponse, ProblemDetailsError } from '@/types/api';

export const http: AxiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request: Bearer-Token anhängen ----
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && !config.headers.has('Authorization')) {
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// ---- Response: Envelope-Unwrap + Single-Flight Refresh ----
let refreshPromise: Promise<string> | null = null;
const SKIP_REFRESH = [
  ENDPOINTS.auth.login,
  ENDPOINTS.auth.refresh,
  ENDPOINTS.auth.register,
  ENDPOINTS.auth.forgotPassword,
  ENDPOINTS.auth.resetPassword,
];

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    'data' in (body as Record<string, unknown>)
  );
}

async function doRefresh(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error('no_refresh_token');
  const res = await axios.post<ApiEnvelope<AuthResponse>>(
    `${env.API_BASE_URL}${ENDPOINTS.auth.refresh}`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  const data = res.data?.data;
  if (!data?.accessToken) throw new Error('refresh_failed');
  useAuthStore.getState().setSession({
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
    permissions: useAuthStore.getState().permissions,
  });
  return data.accessToken;
}

http.interceptors.response.use(
  (response) => {
    if (isEnvelope(response.data)) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError<ProblemDetailsError | ApiEnvelope<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthCall = SKIP_REFRESH.some((p) => url.includes(p));

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = doRefresh().finally(() => {
            // reset nach kurzer Verzögerung, damit ge-queuede Requests den frischen Token nutzen
            setTimeout(() => {
              refreshPromise = null;
            }, 0);
          });
        }
        const newToken = await refreshPromise;
        if (!(original.headers instanceof AxiosHeaders)) {
          original.headers = new AxiosHeaders(original.headers);
        }
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return http(original);
      } catch (e) {
        useAuthStore.getState().clear();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login?expired=1');
        }
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  },
);

// ---- Helper: ProblemDetails extrahieren ----
export function extractProblem(error: unknown): ProblemDetailsError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ProblemDetailsError | undefined;
    if (data && (data.title || data.status)) {
      return data;
    }
    return {
      title: error.message || 'Netzwerkfehler',
      status: error.response?.status ?? 0,
    };
  }
  return { title: 'Unbekannter Fehler', status: 0 };
}

// Convenience-Wrapper
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.get<T>(url, config);
  return r.data;
}
export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.post<T>(url, body, config);
  return r.data;
}
export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.put<T>(url, body, config);
  return r.data;
}
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const r = await http.delete<T>(url, config);
  return r.data;
}

// Test-Hook
export function __resetRefreshState() {
  refreshPromise = null;
}

