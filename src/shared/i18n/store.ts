import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from './translations'

interface LangStore {
  lang: Lang
  setLang: (lang: Lang) => void
}

type PersistedLangStore = Pick<LangStore, 'lang'>

export const useLangStore = create<LangStore>()(
  persist<LangStore, [], [], PersistedLangStore>(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'xn-lang',
      partialize: ({ lang }) => ({ lang }),
      version: 1,
      migrate: () => ({ lang: 'en' }),
    },
  ),
)
