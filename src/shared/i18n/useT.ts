import { useLangStore } from './store'
import { translations } from './translations'

/** Returns the full translation object for the current language. */
export function useT() {
  const lang = useLangStore((s) => s.lang)
  return translations[lang]
}
