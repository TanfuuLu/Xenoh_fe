import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { MessagePageResponse, MessageResponse } from '../types'

export const messageKeys = {
  byRelationship: (relationshipId: string) =>
    ['messages', relationshipId] as const,
  unreadCounts: ['messages', 'unread-counts'] as const,
}

export function useMessages(relationshipId: string) {
  return useInfiniteQuery({
    queryKey: messageKeys.byRelationship(relationshipId),
    queryFn: ({ pageParam }) =>
      api
        .get<MessagePageResponse>(ENDPOINTS.messages.byRelationship(relationshipId), {
          params: {
            pageSize: 30,
            ...(pageParam ? { before: pageParam } : {}),
          },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined
      return lastPage.items[0]?.createdAt ?? undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!relationshipId,
  })
}

export function useSendMessage(relationshipId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api
        .post<MessageResponse>(ENDPOINTS.messages.byRelationship(relationshipId), { content })
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: messageKeys.byRelationship(relationshipId) })
    },
  })
}

export function useMarkMessagesRead(relationshipId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(ENDPOINTS.messages.markRead(relationshipId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: messageKeys.unreadCounts })
    },
  })
}

export function useUnreadCounts() {
  return useQuery({
    queryKey: messageKeys.unreadCounts,
    queryFn: () =>
      api
        .get<Record<string, number>>(ENDPOINTS.messages.unreadCounts)
        .then((r) => r.data),
  })
}
