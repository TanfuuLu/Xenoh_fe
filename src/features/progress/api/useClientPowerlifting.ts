import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { ClientPowerliftingResponse } from '../types'

export const clientPowerliftingKeys = {
  byClient: (clientId: string) => ['progress', 'powerlifting', 'client', clientId] as const,
}

export function useClientPowerlifting(clientId: string | null) {
  return useQuery({
    queryKey: clientPowerliftingKeys.byClient(clientId ?? ''),
    queryFn: () =>
      api
        .get<ClientPowerliftingResponse>(ENDPOINTS.coachClient.clientPowerlifting(clientId!))
        .then((r) => r.data),
    enabled: !!clientId,
  })
}
