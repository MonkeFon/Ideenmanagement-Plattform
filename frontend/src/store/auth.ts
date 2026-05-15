import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MeResponse } from '@/types/api'

interface AuthState {
  token: string | null
  user: MeResponse | null
  setAuth: (token: string, user: MeResponse) => void
  clear: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'geistesblitz-auth' },
  ),
)
