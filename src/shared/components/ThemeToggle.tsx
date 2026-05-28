import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/shared/theme'
import type { Theme } from '@/shared/theme'

interface Props {
  onChange?: (theme: Theme) => void
}

export function ThemeToggle({ onChange }: Props) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const isDark = theme === 'dark'
  const nextTheme: Theme = isDark ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="xn-theme-toggle xn-icon-button"
      onClick={() => {
        setTheme(nextTheme)
        onChange?.(nextTheme)
      }}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
