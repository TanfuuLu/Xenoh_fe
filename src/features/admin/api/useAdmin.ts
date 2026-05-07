import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { PlanType, UserRole } from '@/shared/types/api'
import type {
  AdminDashboardResponse,
  AdminPaymentOrder,
  AdminPaymentSummary,
  AdminPlanListItem,
  AdminReportSummaryResponse,
  AdminSubscription,
  AdminUserDetail,
  AdminUserListItem,
  PaymentStatus,
  PlanTier,
} from '../types'

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  reportsSummary: ['admin', 'reports', 'summary'] as const,
  users: (filters: unknown) => ['admin', 'users', filters] as const,
  user: (id: string) => ['admin', 'users', id] as const,
  plans: (filters: unknown) => ['admin', 'plans', filters] as const,
  payments: (filters: unknown) => ['admin', 'payments', filters] as const,
  paymentsSummary: ['admin', 'payments', 'summary'] as const,
  subscriptions: ['admin', 'subscriptions'] as const,
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: () => api.get<AdminDashboardResponse>(ENDPOINTS.admin.dashboard).then((r) => r.data),
  })
}

export function useAdminReportSummary() {
  return useQuery({
    queryKey: adminKeys.reportsSummary,
    queryFn: () => api.get<AdminReportSummaryResponse>(ENDPOINTS.admin.reportsSummary).then((r) => r.data),
  })
}

export function useAdminUsers(filters: {
  search?: string
  role?: UserRole | ''
  tier?: PlanTier | ''
  suspended?: string
}) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () =>
      api
        .get<AdminUserListItem[]>(ENDPOINTS.admin.users, {
          params: {
            search: filters.search || undefined,
            role: filters.role || undefined,
            tier: filters.tier || undefined,
            suspended: filters.suspended === '' ? undefined : filters.suspended,
          },
        })
        .then((r) => r.data),
  })
}

export function useAdminUser(userId?: string) {
  return useQuery({
    queryKey: userId ? adminKeys.user(userId) : ['admin', 'users', 'empty'],
    enabled: Boolean(userId),
    queryFn: () => api.get<AdminUserDetail>(ENDPOINTS.admin.user(userId!)).then((r) => r.data),
  })
}

export function useAdminPlans(filters: {
  planType?: PlanType | ''
  ownerId?: string
  coachId?: string
  from?: string
  to?: string
  isActive?: string
}) {
  return useQuery({
    queryKey: adminKeys.plans(filters),
    queryFn: () =>
      api
        .get<AdminPlanListItem[]>(ENDPOINTS.admin.plans, {
          params: {
            planType: filters.planType || undefined,
            ownerId: filters.ownerId || undefined,
            coachId: filters.coachId || undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
            isActive: filters.isActive === '' ? undefined : filters.isActive,
          },
        })
        .then((r) => r.data),
  })
}

export function useAdminPayments(filters: {
  status?: PaymentStatus | ''
  tier?: PlanTier | ''
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: adminKeys.payments(filters),
    queryFn: () =>
      api
        .get<AdminPaymentOrder[]>(ENDPOINTS.admin.payments, {
          params: {
            status: filters.status || undefined,
            tier: filters.tier || undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
          },
        })
        .then((r) => r.data),
  })
}

export function useAdminPaymentSummary() {
  return useQuery({
    queryKey: adminKeys.paymentsSummary,
    queryFn: () => api.get<AdminPaymentSummary>(ENDPOINTS.admin.paymentsSummary).then((r) => r.data),
  })
}

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: adminKeys.subscriptions,
    queryFn: () => api.get<AdminSubscription[]>(ENDPOINTS.admin.subscriptions).then((r) => r.data),
  })
}

export function useAdminSuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.post(ENDPOINTS.admin.suspendUser(userId)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export function useAdminUnsuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.post(ENDPOINTS.admin.unsuspendUser(userId)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  })
}
