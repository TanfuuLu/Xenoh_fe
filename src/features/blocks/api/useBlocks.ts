import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: blockKeys.list })
    },
  })
}

export function useUnblockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete(ENDPOINTS.blocks.unblock(userId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: blockKeys.list })
    },
  })
}
