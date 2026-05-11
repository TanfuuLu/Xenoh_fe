import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { PersonalDashboardResponse } from '../types'

export const dashboardKeys = {
  personal: ['dashboard', 'personal'] as const,
}

export function usePersonalDashboard() {
  return useQuery({
    queryKey: dashboardKeys.personal,
    queryFn: () =>
      api.get<PersonalDashboardResponse>(ENDPOINTS.dashboard.personal).then((r) => r.data),
  })
}
