import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { coachKeys } from '@/features/coaches/api/useCoaches'
import type { BlockUserRequest, BlockedUserResponse } from '../types'

export const blockKeys = {
  list: ['blocks', 'mine'] as const,
}

export function useMyBlocks() {
  return useQuery({
    queryKey: blockKeys.list,
    queryFn: () =>
      api.get<BlockedUserResponse[]>(ENDPOINTS.blocks.list).then((r) => r.data),
  })
}

export function useBlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string | null }) => {
      const body: BlockUserRequest = { reason: reason ?? null }
      return api.post(ENDPOINTS.blocks.block(userId), body)
    },
    onSuccess: (_, { userId }) => {
      void qc.invalidateQueries({ queryKey: blockKeys.list })
      void qc.invalidateQueries({ queryKey: coachKeys.all })
      void qc.invalidateQueries({ queryKey: coachKeys.profile(userId) })
    },
  })
}

export function useUnblockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete(ENDPOINTS.blocks.unblock(userId)),
    onSuccess: (_, userId) => {
      void qc.invalidateQueries({ queryKey: blockKeys.list })
      void qc.invalidateQueries({ queryKey: coachKeys.all })
      void qc.invalidateQueries({ queryKey: coachKeys.profile(userId) })
    },
  })
}
