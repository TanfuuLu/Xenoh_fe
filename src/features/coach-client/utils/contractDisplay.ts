import type { CoachingType } from '../types'

export function coachingTypeLabel(type: string) {
  if (type === 'Monthly') return 'Price per month'
  if (type === 'Session') return 'Price per session'
  return type
}

export function formatContractPrice(value: number | null | undefined, currency: string) {
  if (value == null) return '-'
  return `${new Intl.NumberFormat('vi-VN').format(value)} ${currency}`
}

export function formatCoachingQuantity(type: string, quantity: number | null | undefined) {
  if (!quantity) return null
  const unit = type === 'Monthly' ? 'month' : 'session'
  return `${quantity} ${unit}${quantity === 1 ? '' : 's'}`
}

export function formatContractSelection({
  type,
  price,
  currency,
  quantity,
}: {
  type: CoachingType | string
  price: number | null | undefined
  currency: string
  quantity?: number | null
}) {
  return [
    coachingTypeLabel(type),
    formatContractPrice(price, currency),
    formatCoachingQuantity(type, quantity),
  ].filter(Boolean).join(' · ')
}
