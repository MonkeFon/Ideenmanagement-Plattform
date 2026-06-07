import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MeResponse } from '@/types/api'

interface AuthState {
  token: string | null
  user: MeResponse | null
  setAuth: (token: string, user: MeResponse) => void
  setUser: (user: MeResponse) => void
  clear: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      // Refresh the cached profile without touching the token. Used on app load to
      // re-sync server-side changes (e.g. tenant rename, role change) into the
      // persisted snapshot, which would otherwise stay stale until a manual re-login.
      setUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'geistesblitz-auth' },
  ),
)
