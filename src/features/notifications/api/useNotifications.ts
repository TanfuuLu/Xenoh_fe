import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { useNotificationStore } from '../store/notificationStore'
import type { NotificationResponse } from '../types'

export const notificationKeys = {
  all: ['notifications'] as const,
}

export function useNotifications() {
  const setNotifications = useNotificationStore((s) => s.setNotifications)

  const query = useQuery({
    queryKey: notificationKeys.all,
    queryFn: () =>
      api.get<NotificationResponse[]>(ENDPOINTS.notifications.list).then((r) => r.data),
  })

  useEffect(() => {
    if (query.data) setNotifications(query.data)
  }, [query.data, setNotifications])

  return query
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  const markRead = useNotificationStore((s) => s.markRead)

  return useMutation({
    mutationFn: (id: string) =>
      api.patch(ENDPOINTS.notifications.markRead(id)).then(() => id),
    onSuccess: (id) => {
      markRead(id)
      qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  return useMutation({
    mutationFn: () => api.patch(ENDPOINTS.notifications.markAllRead),
    onSuccess: () => {
      markAllRead()
      qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
