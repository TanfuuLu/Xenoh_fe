export type PlanTier = 'Free' | 'ProIndividual' | 'ProCoach'

export interface SubscriptionResponse {
  id: string
  tier: PlanTier
  isActive: boolean
  expiresAt: string | null
  createdAt: string
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
  durationMonths: 1 | 3 | 12
}

export const TIER_LABELS: Record<PlanTier, string> = {
  Free: 'Free',
  ProIndividual: 'Pro Individual',
  ProCoach: 'Pro Coach',
}

export const TIER_PRICES: Record<Exclude<PlanTier, 'Free'>, Record<1 | 3 | 12, number>> = {
  ProIndividual: { 1: 10_000, 3: 30_000, 12: 120_000 },
  ProCoach:      { 1: 20_000, 3: 60_000, 12: 240_000 },
}
