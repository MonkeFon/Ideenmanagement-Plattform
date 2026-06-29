import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({ theme: 'auto', setTheme: (t) => set({ theme: t }) }),
    { name: 'gb-theme' },
  ),
)

export function resolveDark(theme: Theme): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const dark = resolveDark(theme)
  root.classList.toggle('dark', dark)
}
