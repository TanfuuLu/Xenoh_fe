import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/shared/types/api'

interface AuthUser {
  id?: string
  email: string
  fullName: string
  avatarUrl?: string | null
  roles: UserRole[]
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void
  setUser: (user: Partial<AuthUser>) => void
  clear: () => void
  isAuthenticated: () => boolean
  hasRole: (role: UserRole) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      setUser: (user) => set((state) => ({ user: state.user ? { ...state.user, ...user } : null })),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      isAuthenticated: () => !!get().accessToken,
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: 'xenoh-auth',
      version: 1,
      migrate: () => ({ accessToken: null, refreshToken: null, user: null }),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
)
