import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as signalR from '@microsoft/signalr'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { planCommentKeys } from '@/features/comments/api/usePlanComments'
import { weekCommentKeys } from '@/features/comments/api/useWeekComments'
import type { CommentResponse } from '@/features/comments/types'
import { useNotificationStore } from '../store/notificationStore'
import type { NotificationResponse } from '../types'

const HUB_URL = `${import.meta.env['VITE_API_URL'] as string}/hubs/notifications`

const TYPE_LABELS: Record<string, string> = {
  NewComment: 'Bình luận mới',
  PlanAssigned: 'Kế hoạch mới',
  ExerciseWarning: 'Cảnh báo bài tập',
}

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
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ReceiveNotification', (payload: NotificationResponse) => {
      addNotification(payload)
      toast.info(TYPE_LABELS[payload.type] ?? 'Thông báo', {
        description: payload.message,
      })
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

    connection.start().catch(() => {})

    return () => {
      connection.stop().catch(() => {})
    }
  }, [accessToken, addNotification, queryClient])
}
