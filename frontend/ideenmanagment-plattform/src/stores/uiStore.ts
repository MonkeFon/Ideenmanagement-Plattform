import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  setMobileDrawer: (open: boolean) => void;
}

function applyTheme(t: Theme) {
  const sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = t === 'dark' || (t === 'system' && sys);
  document.documentElement.classList.toggle('dark', dark);
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      mobileDrawerOpen: false,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileDrawer: (open) => set({ mobileDrawerOpen: open }),
    }),
    {
      name: 'idea.ui',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

