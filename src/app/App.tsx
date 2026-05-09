import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { QueryProvider } from './QueryProvider'
import { router } from './Router'
import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { useLangStore } from '@/shared/i18n'
import { initAxiosInterceptors } from '@/shared/api/axios'

export function App() {
  const { setAuth, clear } = useAuthStore()
  const lang = useLangStore((s) => s.lang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    initAxiosInterceptors(
      () => useAuthStore.getState().accessToken,
      () => useAuthStore.getState().refreshToken,
      (token, refresh) => {
        const user = useAuthStore.getState().user
        if (user) setAuth(token, refresh, user)
      },
      clear,
    )
  }, [setAuth, clear])

  return (
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors duration={4000} />
    </QueryProvider>
  )
}
