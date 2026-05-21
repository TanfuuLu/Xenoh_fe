import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { slideUp } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { useDeleteFoodLog } from '../../api/useFoodLog'
import type { FoodLogItemResponse, FoodLogsTotals } from '../../types'

interface Props {
  date: string
  items: FoodLogItemResponse[]
  totals: FoodLogsTotals
}

export function FoodLogList({ date, items, totals }: Props) {
  const deleteMutation = useDeleteFoodLog(date)
  const shouldReduceMotion = useReducedMotion()
  const t = useT()
  const lang = useLangStore((s) => s.lang)

  if (items.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--fg-3)' }}>
        {t.nutrition.foodLogListEmpty}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            {...(!shouldReduceMotion ? { initial: 'hidden', animate: 'visible', exit: 'hidden', variants: slideUp } : {})}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
            style={{ background: 'var(--surface-2, var(--surface))' }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)' }}>
                {lang === 'vi' ? item.nameVi : item.nameEn}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
                {item.servingLabelVi
                  ? `${item.servingCount} × ${lang === 'vi' ? item.servingLabelVi : (item.servingLabelEn ?? item.servingLabelVi)}`
                  : `${item.grams}g`}{' '}
                · {item.computedCalories} kcal · P {item.computedProteinG.toFixed(1)}g · C{' '}
                {item.computedCarbsG.toFixed(1)}g · F {item.computedFatG.toFixed(1)}g
              </p>
            </div>

            <button
              type="button"
              onClick={() => deleteMutation.mutate(item.id)}
              disabled={deleteMutation.isPending}
              className="shrink-0 p-1.5 rounded-md transition-opacity hover:opacity-70"
              style={{ color: 'var(--xn-danger)' }}
              aria-label={`${t.nutrition.foodLogCancel} ${lang === 'vi' ? item.nameVi : item.nameEn}`}
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <div
        className="flex justify-between rounded-lg px-3 py-2.5 text-sm font-medium mt-1"
        style={{ background: 'var(--xn-primary)', color: '#fff' }}
      >
        <span>{t.nutrition.foodLogTotal}</span>
        <span>
          {totals.totalCalories} kcal · P {totals.totalProteinG.toFixed(1)}g · C{' '}
          {totals.totalCarbsG.toFixed(1)}g · F {totals.totalFatG.toFixed(1)}g
        </span>
      </div>
    </div>
  )
}
