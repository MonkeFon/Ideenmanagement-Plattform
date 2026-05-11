import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse } from '@/types/api';

interface AuthState {
  user: UserResponse | null;
  permissions: string[];
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  setSession: (data: {
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    permissions?: string[];
  }) => void;
  setTokens: (accessToken: string, refreshToken: string, expiresAt?: string) => void;
  setUser: (user: UserResponse, permissions?: string[]) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      permissions: [],
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      setSession: ({ user, accessToken, refreshToken, expiresAt, permissions }) =>
        set({
          user,
          accessToken,
          refreshToken,
          expiresAt,
          permissions: permissions ?? [],
        }),
      setTokens: (accessToken, refreshToken, expiresAt) =>
        set((s) => ({
          accessToken,
          refreshToken,
          expiresAt: expiresAt ?? s.expiresAt,
        })),
      setUser: (user, permissions) =>
        set((s) => ({ user, permissions: permissions ?? s.permissions })),
      clear: () =>
        set({
          user: null,
          permissions: [],
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        }),
    }),
    { name: 'idea.auth' },
  ),
);

