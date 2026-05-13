import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { QueryProvider } from './QueryProvider'
import { router } from './Router'
import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { refreshAuth } from '@/features/auth/api/useAuth'
import { useLangStore } from '@/shared/i18n'
import { initAxiosInterceptors } from '@/shared/api/axios'
import { useThemeStore } from '@/shared/theme'

export function App() {
  const { setAuth, clear, setAuthChecked } = useAuthStore()
  const lang = useLangStore((s) => s.lang)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    initAxiosInterceptors(
      () => useAuthStore.getState().accessToken,
      (response) => {
        setAuth(response.accessToken, {
          id: response.userId,
          email: response.email,
          fullName: response.fullName,
          avatarUrl: response.avatarUrl,
          roles: response.roles,
        })
      },
      clear,
    )
  }, [setAuth, clear])

  useEffect(() => {
    let cancelled = false

    refreshAuth()
      .catch(() => {
        if (!cancelled) clear()
      })
      .finally(() => {
        if (!cancelled) setAuthChecked(true)
      })

    return () => {
      cancelled = true
    }
  }, [clear, setAuthChecked])

  return (
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors duration={4000} theme={theme} />
    </QueryProvider>
  )
}
