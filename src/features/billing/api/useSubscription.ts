import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { CreatePaymentOrderRequest, PaymentOrderResponse, SubscriptionResponse } from '../types'

export const billingKeys = {
  subscription: ['subscription'] as const,
}

export function useSubscription() {
  return useQuery({
    queryKey: billingKeys.subscription,
    queryFn: () => api.get<SubscriptionResponse>(ENDPOINTS.subscriptions.me).then((r) => r.data),
  })
}

export function useRefreshSubscription() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: billingKeys.subscription })
}

export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: (data: CreatePaymentOrderRequest) =>
      api.post<PaymentOrderResponse>(ENDPOINTS.subscriptions.createOrder, data).then((r) => r.data),
  })
}
