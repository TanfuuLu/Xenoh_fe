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
  user: AuthUser | null
  authChecked: boolean
  setAuth: (token: string, user: AuthUser) => void
  setUser: (user: Partial<AuthUser>) => void
  setAuthChecked: (checked: boolean) => void
  clear: () => void
  isAuthenticated: () => boolean
  hasRole: (role: UserRole) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      authChecked: false,
      setAuth: (accessToken, user) => set({ accessToken, user, authChecked: true }),
      setUser: (user) => set((state) => ({ user: state.user ? { ...state.user, ...user } : null })),
      setAuthChecked: (authChecked) => set({ authChecked }),
      clear: () => set({ accessToken: null, user: null, authChecked: true }),
      isAuthenticated: () => !!get().accessToken,
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: 'xenoh-auth',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AuthState> | undefined
        return { accessToken: null, user: state?.user ?? null, authChecked: false }
      },
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
)
