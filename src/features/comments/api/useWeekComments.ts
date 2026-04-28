import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { CommentResponse } from '../types'

export const weekCommentKeys = {
  byWeek: (weekId: string) => ['week-comments', weekId] as const,
}

export function useWeekComments(weekId: string) {
  return useQuery({
    queryKey: weekCommentKeys.byWeek(weekId),
    queryFn: () =>
      api
        .get<CommentResponse[]>(ENDPOINTS.weekComments.list(weekId))
        .then((r) => r.data),
  })
}

export function useAddWeekComment(weekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api
        .post<CommentResponse>(ENDPOINTS.weekComments.create(weekId), { content })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: weekCommentKeys.byWeek(weekId) })
    },
  })
}

export function useDeleteWeekComment(weekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) =>
      api.delete(ENDPOINTS.weekComments.delete(weekId, commentId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: weekCommentKeys.byWeek(weekId) })
    },
  })
}
