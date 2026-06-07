import { useEffect } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '@/features/auth/store/authStore'
import { planCommentKeys } from '@/features/comments/api/usePlanComments'
import { weekCommentKeys } from '@/features/comments/api/useWeekComments'
import type { CommentResponse } from '@/features/comments/types'
import { messageKeys } from '@/features/chat/api/useMessages'
import { useChatStore } from '@/features/chat/store/chatStore'
import type { MessagePageResponse, MessageResponse } from '@/features/chat/types'
import { useNotificationStore } from '../store/notificationStore'
import type { NotificationResponse } from '../types'
import { API_BASE_URL } from '@/shared/api/baseUrl'

const HUB_URL = `${API_BASE_URL}/hubs/notifications`


type PlanCommentAddedPayload = {
  planId: string
  comment: CommentResponse
}

type WeekCommentAddedPayload = {
  weekId: string
  comment: CommentResponse
}

type PlanCommentDeletedPayload = {
  planId: string
  commentId: string
}

type WeekCommentDeletedPayload = {
  weekId: string
  commentId: string
}

function appendComment(old: CommentResponse[] | undefined, comment: CommentResponse) {
  const comments = old ?? []
  if (comments.some((c) => c.id === comment.id)) return comments
  return [...comments, comment]
}

export function useNotificationHub() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!accessToken) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build()

    connection.on('ReceiveNotification', (payload: NotificationResponse) => {
      addNotification(payload)
    })

    connection.on('ReceivePlanCommentAdded', (payload: PlanCommentAddedPayload) => {
      queryClient.setQueryData<CommentResponse[]>(
        planCommentKeys.byPlan(payload.planId),
        (old) => appendComment(old, payload.comment),
      )
    })

    connection.on('ReceivePlanCommentDeleted', (payload: PlanCommentDeletedPayload) => {
      queryClient.setQueryData<CommentResponse[]>(
        planCommentKeys.byPlan(payload.planId),
        (old = []) => old.filter((comment) => comment.id !== payload.commentId),
      )
    })

    connection.on('ReceiveWeekCommentAdded', (payload: WeekCommentAddedPayload) => {
      queryClient.setQueryData<CommentResponse[]>(
        weekCommentKeys.byWeek(payload.weekId),
        (old) => appendComment(old, payload.comment),
      )
    })

    connection.on('ReceiveWeekCommentDeleted', (payload: WeekCommentDeletedPayload) => {
      queryClient.setQueryData<CommentResponse[]>(
        weekCommentKeys.byWeek(payload.weekId),
        (old = []) => old.filter((comment) => comment.id !== payload.commentId),
      )
    })

    connection.on('ReceiveMessage', (payload: MessageResponse) => {
      queryClient.setQueryData<InfiniteData<MessagePageResponse>>(
        messageKeys.byRelationship(payload.relationshipId),
        (old) => {
          if (!old || old.pages.length === 0) return old
          const firstPage = old.pages[0]
          if (firstPage.items.some((m) => m.id === payload.id)) return old
          return {
            ...old,
            pages: [
              { ...firstPage, items: [...firstPage.items, payload] },
              ...old.pages.slice(1),
            ],
          }
        },
      )

      const currentUserId = useAuthStore.getState().user?.id
      if (payload.senderId !== currentUserId) {
        useChatStore.getState().incrementUnread(payload.relationshipId)
      }
    })

    void connection.start().catch(() => {})

    return () => {
      void connection.stop()
    }
  }, [accessToken, addNotification, queryClient])
}
