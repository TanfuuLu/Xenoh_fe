import { RouterProvider } from 'react-router'
import { QueryProvider } from './QueryProvider'
import { router } from './Router'
import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { initAxiosInterceptors } from '@/shared/api/axios'

export function App() {
  const { accessToken, refreshToken, setAuth, clear } = useAuthStore()

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
    </QueryProvider>
  )
}
