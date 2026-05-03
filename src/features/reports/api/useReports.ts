import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { ReportReason, ReportStatus } from '@/shared/types/api'
import type { CreateUserReportRequest, ReviewReportRequest, UserReportResponse } from '../types'

export const reportKeys = {
  all: ['reports'] as const,
  admin: (status = '', reason = '') => ['reports', 'admin', status, reason] as const,
}

export function useCreateUserReport(userId: string) {
  return useMutation({
    mutationFn: (payload: CreateUserReportRequest) =>
      api.post<UserReportResponse>(ENDPOINTS.users.report(userId), payload).then((r) => r.data),
  })
}

export function useAdminReports(filters?: { status?: ReportStatus | ''; reason?: ReportReason | '' }) {
  return useQuery({
    queryKey: reportKeys.admin(filters?.status ?? '', filters?.reason ?? ''),
    queryFn: () =>
      api
        .get<UserReportResponse[]>(ENDPOINTS.admin.reports, {
          params: {
            status: filters?.status || undefined,
            reason: filters?.reason || undefined,
          },
        })
        .then((r) => r.data),
  })
}

export function useReviewReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewReportRequest }) =>
      api.patch<UserReportResponse>(ENDPOINTS.admin.report(id), payload).then((r) => r.data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  })
}

export function useSuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.post(ENDPOINTS.admin.suspendUser(userId)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  })
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.post(ENDPOINTS.admin.unsuspendUser(userId)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  })
}
