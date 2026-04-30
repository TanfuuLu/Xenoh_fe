import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { CommentResponse } from '../types'

export const planCommentKeys = {
  byPlan: (planId: string) => ['plan-comments', planId] as const,
}

function appendComment(old: CommentResponse[] | undefined, comment: CommentResponse) {
  const comments = old ?? []
  if (comments.some((c) => c.id === comment.id)) return comments
  return [...comments, comment]
}

export function usePlanComments(planId: string) {
  return useQuery({
    queryKey: planCommentKeys.byPlan(planId),
    queryFn: () =>
      api
        .get<CommentResponse[]>(ENDPOINTS.planComments.list(planId))
        .then((r) => r.data),
  })
}

export function useAddPlanComment(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      api
        .post<CommentResponse>(ENDPOINTS.planComments.create(planId), { content })
        .then((r) => r.data),
    onSuccess: (newComment) => {
      qc.setQueryData<CommentResponse[]>(planCommentKeys.byPlan(planId), (old) =>
        appendComment(old, newComment),
      )
    },
  })
}

export function useDeletePlanComment(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) =>
      api.delete(ENDPOINTS.planComments.delete(planId, commentId)),
    onSuccess: (_, commentId) => {
      qc.setQueryData<CommentResponse[]>(planCommentKeys.byPlan(planId), (old = []) =>
        old.filter((c) => c.id !== commentId),
      )
    },
  })
}
