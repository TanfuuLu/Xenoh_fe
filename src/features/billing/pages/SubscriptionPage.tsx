import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { useCreatePaymentOrder } from '../api/useSubscription'
import { CurrentPlanCard } from '../components/CurrentPlanCard'
import { PricingTable } from '../components/PricingTable'
import { PaymentOrderModal } from '../components/PaymentOrderModal'
import type { PaymentOrderResponse, PlanTier } from '../types'

export function SubscriptionPage() {
  const [order, setOrder] = useState<PaymentOrderResponse | null>(null)
  const { mutate: createOrder, isPending } = useCreatePaymentOrder()

  function handleSelectTier(tier: Exclude<PlanTier, 'Free'>, durationMonths: 1 | 3 | 12) {
    createOrder(
      { requestedTier: tier, durationMonths },
      {
        onSuccess: (data) => {
          setOrder(data)
        },
        onError: () => {
          toast.error('Failed to create payment order', {
            description: 'Please try again.',
          })
        },
      },
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex flex-col gap-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={slideUp}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--fg-1)', margin: 0 }}>
          Subscription
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>
          Manage your plan and unlock premium features.
        </p>
      </motion.div>

      {/* Current plan */}
      <motion.div variants={slideUp}>
        <CurrentPlanCard />
      </motion.div>

      {/* Pricing */}
      <motion.div variants={slideUp} className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--fg-1)', margin: 0 }}>
            Choose a Plan
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-3)' }}>
            Upgrade anytime. Subscriptions stack — paying while active extends your expiry.
          </p>
        </div>
        <PricingTable onSelect={handleSelectTier} loading={isPending} />
      </motion.div>

      {/* Payment modal */}
      <PaymentOrderModal order={order} onClose={() => setOrder(null)} />
    </motion.div>
  )
}
