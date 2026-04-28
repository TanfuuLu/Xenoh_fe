import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { CommentResponse } from '../types'

export const planCommentKeys = {
  byPlan: (planId: string) => ['plan-comments', planId] as const,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planCommentKeys.byPlan(planId) })
    },
  })
}

export function useDeletePlanComment(planId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) =>
      api.delete(ENDPOINTS.planComments.delete(planId, commentId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planCommentKeys.byPlan(planId) })
    },
  })
}
