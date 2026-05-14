import { motion } from 'framer-motion'
import { Spinner } from '@/shared/components/Spinner'
import { staggerContainer } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useNutritionHistory } from '../api/useNutrition'
import { HistoryDayCard } from './HistoryDayCard'

interface Props {
  from: string
  to: string
  enabled: boolean
  clientId?: string
  calorieTarget: number | null
}

export function NutritionHistoryCards({ from, to, enabled, clientId, calorieTarget }: Props) {
  const t = useT()
  const { data, isLoading } = useNutritionHistory(from, to, enabled, clientId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--fg-3)' }}>
        {t.nutrition.historyCardsEmpty}
      </p>
    )
  }

  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex flex-col gap-2"
    >
      {sorted.map((entry) => (
        <HistoryDayCard key={entry.date} entry={entry} calorieTarget={calorieTarget} />
      ))}
    </motion.div>
    </div>
  )
}
