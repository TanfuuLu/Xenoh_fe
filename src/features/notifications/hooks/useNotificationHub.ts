import { useEffect } from 'react'
import * as signalR from '@microsoft/signalr'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import type { NotificationResponse } from '../types'

const HUB_URL = `${import.meta.env['VITE_API_URL'] as string}/hubs/notifications`

const TYPE_LABELS: Record<string, string> = {
  NewComment: 'Bình luận mới',
  PlanAssigned: 'Kế hoạch mới',
  ExerciseWarning: 'Cảnh báo bài tập',
}

export function useNotificationHub() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    if (!accessToken) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ReceiveNotification', (payload: NotificationResponse) => {
      addNotification(payload)
      toast.info(TYPE_LABELS[payload.type] ?? 'Thông báo', {
        description: payload.message,
      })
    })

    connection.start().catch(() => {})

    return () => {
      connection.stop().catch(() => {})
    }
  }, [accessToken, addNotification])
}
