export type PlanTier = 'Free' | 'ProIndividual' | 'ProCoach'
export type PaidDurationMonths = 1 | 3 | 6 | 12

export interface SubscriptionResponse {
  id: string
  tier: PlanTier
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  aiQuota: AiQuotaResponse
}

export interface AiQuotaResponse {
  monthlyLimit: number
  usedRequests: number
  remainingRequests: number
  periodStart: string
}

export interface PaymentOrderResponse {
  orderId: string
  transferCode: string
  amount: number
  durationMonths: number
  requestedTier: PlanTier
  expiresAt: string
  bankAccountNumber: string
  bankAccountName: string
  bankName: string
  transferDescription: string
}

export interface CreatePaymentOrderRequest {
  requestedTier: Exclude<PlanTier, 'Free'>
  durationMonths: PaidDurationMonths
}

export const TIER_LABELS: Record<PlanTier, string> = {
  Free: 'Free',
  ProIndividual: 'Pro Individual',
  ProCoach: 'Pro Coach',
}

export const TIER_PRICES: Record<Exclude<PlanTier, 'Free'>, Record<PaidDurationMonths, number>> = {
  ProIndividual: { 1: 149_000, 3: 447_000, 6: 894_000, 12: 1_788_000 },
  ProCoach:      { 1: 299_000, 3: 897_000, 6: 1_794_000, 12: 3_588_000 },
}

export const TIER_LIST_PRICES: Record<Exclude<PlanTier, 'Free'>, Record<PaidDurationMonths, number>> = {
  ProIndividual: { 1: 149_000, 3: 447_000, 6: 894_000, 12: 1_788_000 },
  ProCoach:      { 1: 299_000, 3: 897_000, 6: 1_794_000, 12: 3_588_000 },
}
