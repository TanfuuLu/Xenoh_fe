import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

type PersistedThemeState = Pick<ThemeState, 'theme'>

export const useThemeStore = create<ThemeState>()(
  persist<ThemeState, [], [], PersistedThemeState>(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'xenoh-theme',
      partialize: ({ theme }) => ({ theme }),
      version: 1,
      migrate: () => ({ theme: 'light' }),
    },
  ),
)
