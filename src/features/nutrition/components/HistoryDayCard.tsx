import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { slideUp } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { cn } from '@/shared/utils/cn'
import { useDayFoodLogs } from '../api/useFoodLog'
import type { FoodLogItemResponse, NutritionHistoryItemResponse } from '../types'

interface Props {
  entry: NutritionHistoryItemResponse
  calorieTarget: number | null
}

interface FoodRowProps {
  item: FoodLogItemResponse
}

function FoodRow({ item }: FoodRowProps) {
  const lang = useLangStore((s) => s.lang)
  const name = lang === 'vi' ? item.nameVi : item.nameEn
  const servingLabel = item.servingLabelVi
    ? `${item.servingCount ?? 1}× ${lang === 'vi' ? item.servingLabelVi : (item.servingLabelEn ?? item.servingLabelVi)}`
    : `${Math.round(item.grams)}g`

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span
        className="text-sm truncate flex-1"
        style={{ color: 'var(--fg-1)' }}
        title={name}
      >
        {name}
      </span>
      <span className="text-xs shrink-0" style={{ color: 'var(--fg-3)' }}>
        {servingLabel} · {Math.round(item.computedCalories)} kcal
      </span>
    </div>
  )
}

export function HistoryDayCard({ entry, calorieTarget }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldReduce = useReducedMotion()
  const t = useT()
  const lang = useLangStore((s) => s.lang)

  const { data, isLoading, isError } = useDayFoodLogs(entry.date, isExpanded)

  const formattedDate = format(parseISO(entry.date), 'EEEE, d MMMM yyyy', { locale: lang === 'vi' ? vi : enUS })

  const caloriePercent =
    calorieTarget && calorieTarget > 0
      ? Math.round((entry.calories / calorieTarget) * 100)
      : null

  const bodyContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-3">
          <Spinner />
        </div>
      )
    }
    if (isError) {
      return (
        <p className="text-xs py-2 text-center" style={{ color: 'var(--xn-danger)' }}>
          {t.nutrition.historyCardsError}
        </p>
      )
    }
    if (!data || data.items.length === 0) {
      return (
        <p className="text-xs py-2 text-center" style={{ color: 'var(--fg-3)' }}>
          {t.nutrition.historyCardsEmpty}
        </p>
      )
    }
    return (
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {data.items.map((item) => (
          <FoodRow key={item.id} item={item} />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUp}
      className="rounded-xl border overflow-hidden"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--surface-border-soft)' }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className={cn(
          'w-full flex items-start gap-3 p-3 text-left transition-colors',
          'hover:bg-white/5 active:bg-white/10',
        )}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium capitalize mb-1.5" style={{ color: 'var(--fg-3)' }}>
            {formattedDate}
            {caloriePercent !== null && (
              <span
                className={cn(
                  'ml-2 font-normal',
                  caloriePercent > 110 ? 'text-warning' : 'text-success',
                )}
              >
                {caloriePercent}%
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="default">{Math.round(entry.calories)} kcal</Badge>
            <Badge variant="primary">P {Math.round(entry.proteinG)}g</Badge>
            <Badge variant="success">C {Math.round(entry.carbsG)}g</Badge>
            <Badge variant="warning">F {Math.round(entry.fatG)}g</Badge>
          </div>
        </div>

        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.2 }}
          className="shrink-0 mt-0.5"
          style={{ color: 'var(--fg-3)' }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={
              shouldReduce
                ? { height: 'auto', opacity: 1 }
                : { height: 'auto', opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } }
            }
            exit={
              shouldReduce
                ? { height: 0, opacity: 0 }
                : { height: 0, opacity: 0, transition: { duration: 0.2 } }
            }
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-3 pb-3 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="pt-2">{bodyContent()}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
