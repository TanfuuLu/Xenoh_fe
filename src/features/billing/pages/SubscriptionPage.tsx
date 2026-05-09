import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router'
import { Zap } from 'lucide-react'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useCreatePaymentOrder } from '../api/useSubscription'
import { CurrentPlanCard } from '../components/CurrentPlanCard'
import { PricingTable } from '../components/PricingTable'
import { PaymentOrderModal } from '../components/PaymentOrderModal'
import type { PaymentOrderResponse, PlanTier } from '../types'

export function SubscriptionPage() {
  const t = useT()
  const ts = t.subscription
  const [order, setOrder] = useState<PaymentOrderResponse | null>(null)
  const { mutate: createOrder, isPending } = useCreatePaymentOrder()
  const [searchParams] = useSearchParams()
  const showCoachBanner = searchParams.get('reason') === 'coach-required'

  function handleSelectTier(tier: Exclude<PlanTier, 'Free'>, durationMonths: 1 | 3 | 12) {
    createOrder(
      { requestedTier: tier, durationMonths },
      {
        onSuccess: (data) => {
          setOrder(data)
        },
        onError: () => {
          toast.error(ts.toastFailedTitle, {
            description: ts.toastFailedDesc,
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
          {ts.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>
          {ts.subtitle}
        </p>
      </motion.div>

      {/* Coach upgrade banner */}
      {showCoachBanner && (
        <motion.div variants={slideUp}>
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid var(--color-warning)',
            }}
          >
            <Zap size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <p className="text-sm font-medium" style={{ color: 'var(--fg-1)', margin: 0 }}>
              {ts.coachBannerStart}
              <strong>{ts.coachBannerStrong}</strong>
              {ts.coachBannerEnd}
            </p>
          </div>
        </motion.div>
      )}

      {/* Current plan */}
      <motion.div variants={slideUp}>
        <CurrentPlanCard />
      </motion.div>

      {/* Pricing */}
      <motion.div variants={slideUp} className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--fg-1)', margin: 0 }}>
            {ts.chooseTitle}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-3)' }}>
            {ts.chooseSubtitle}
          </p>
        </div>
        <PricingTable onSelect={handleSelectTier} loading={isPending} />
      </motion.div>

      {/* Payment modal */}
      <PaymentOrderModal order={order} onClose={() => setOrder(null)} />
    </motion.div>
  )
}
