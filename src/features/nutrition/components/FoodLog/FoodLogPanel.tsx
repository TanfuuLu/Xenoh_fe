import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle, Plus, PlusCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { useT, useLangStore } from '@/shared/i18n'
import { useMidnightRefresh } from '@/shared/hooks/useMidnightRefresh'
import { useDayFoodLogs, useCreateFoodLog, foodLogKeys } from '../../api/useFoodLog'
import { nutritionKeys } from '../../api/useNutrition'
import type { FoodItemResponse } from '../../types'
import { FoodSearchInput } from './FoodSearchInput'
import { QuantityPicker } from './QuantityPicker'
import { FoodLogList } from './FoodLogList'
import { AddCustomFoodDialog } from './AddCustomFoodDialog'

interface QuantityValue {
  grams?: number
  servingLabel?: string
  servingCount?: number
}

interface PendingItem {
  localId: string
  food: FoodItemResponse
  quantity: QuantityValue
}

interface Props {
  date?: Date
}

export function FoodLogPanel({ date }: Props) {
  const [today, setToday] = useState<Date>(date ?? new Date())
  const dateStr = format(today, 'yyyy-MM-dd')

  const qc = useQueryClient()
  useMidnightRefresh(() => {
    const newToday = new Date()
    setToday(newToday)
    const newDateStr = format(newToday, 'yyyy-MM-dd')
    void qc.invalidateQueries({ queryKey: foodLogKeys.dayLogs(newDateStr) })
    void qc.invalidateQueries({ queryKey: nutritionKeys.summary() })
  })

  const { data, isLoading, isError } = useDayFoodLogs(dateStr)
  const createFoodLog = useCreateFoodLog(dateStr)

  const [selectedFood, setSelectedFood] = useState<FoodItemResponse | null>(null)
  const [quantity, setQuantity] = useState<QuantityValue>({ grams: 100 })
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [isConfirming, setIsConfirming] = useState(false)
  const [showCustomDialog, setShowCustomDialog] = useState(false)

  const t = useT()
  const lang = useLangStore((s) => s.lang)
  const shouldReduceMotion = useReducedMotion()
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (!selectedFood || !searchWrapperRef.current) { setPanelPos(null); return }
    function recalc() {
      if (!searchWrapperRef.current) return
      const r = searchWrapperRef.current.getBoundingClientRect()
      setPanelPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    recalc()
    window.addEventListener('resize', recalc)
    window.addEventListener('scroll', recalc, true)
    return () => {
      window.removeEventListener('resize', recalc)
      window.removeEventListener('scroll', recalc, true)
    }
  }, [selectedFood])

  const handleFoodSelect = (food: FoodItemResponse) => {
    setSelectedFood(food)
    setQuantity({ grams: 100 })
  }

  const handleAdd = () => {
    if (!selectedFood) return
    setPendingItems((prev) => [
      ...prev,
      { localId: crypto.randomUUID(), food: selectedFood, quantity: { ...quantity } },
    ])
    setSelectedFood(null)
    setQuantity({ grams: 100 })
  }

  const handleRemovePending = (localId: string) => {
    setPendingItems((prev) => prev.filter((item) => item.localId !== localId))
  }

  const handleConfirm = async () => {
    if (pendingItems.length === 0 || isConfirming) return
    setIsConfirming(true)
    try {
      for (const item of pendingItems) {
        await createFoodLog.mutateAsync({
          foodItemId: item.food.id,
          ...item.quantity,
        })
      }
      setPendingItems([])
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCustomFoodCreated = (food: FoodItemResponse) => {
    handleFoodSelect(food)
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={searchWrapperRef}>
        <FoodSearchInput onSelect={handleFoodSelect} />
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedFood && panelPos && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 24, stiffness: 320, mass: 0.6 } }}
              exit={{ opacity: 0, y: -4, scale: 0.975, transition: { duration: 0.1 } }}
              style={{
                position: 'fixed',
                top: panelPos.top,
                left: panelPos.left,
                width: panelPos.width,
                zIndex: 9998,
                background: 'var(--bg-2)',
                border: '2px solid var(--surface-border-soft)',
                borderRadius: 12,
                boxShadow: 'var(--sh-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>
                  {lang === 'vi' ? selectedFood.nameVi : selectedFood.nameEn}
                </p>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>
                  {selectedFood.caloriesPer100g} kcal · P {selectedFood.proteinPer100g}g · C{' '}
                  {selectedFood.carbsPer100g}g · F {selectedFood.fatPer100g}g / 100g
                </p>
              </div>

              <QuantityPicker food={selectedFood} onChange={setQuantity} />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedFood(null)}
                  className="flex-1 justify-center"
                >
                  {t.nutrition.foodLogCancel}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!quantity.grams && !quantity.servingLabel}
                  className="flex-1 justify-center"
                >
                  <Plus size={14} />
                  {t.nutrition.foodLogAdd}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* Pending items staging area */}
      <AnimatePresence>
        {pendingItems.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            className="flex flex-col gap-2"
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
              {t.nutrition.foodLogPending} ({pendingItems.length})
            </p>

            <AnimatePresence initial={false}>
              {pendingItems.map((item) => (
                <motion.div
                  key={item.localId}
                  layout
                  initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, x: -8, transition: { duration: 0.12 } }}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                  style={{
                    background: 'var(--surface-2, var(--surface))',
                    border: '1.5px dashed var(--xn-primary)',
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)' }}>
                      {lang === 'vi' ? item.food.nameVi : item.food.nameEn}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
                      {item.quantity.servingLabel
                        ? `${item.quantity.servingCount ?? 1} × ${item.quantity.servingLabel}`
                        : `${item.quantity.grams}g`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePending(item.localId)}
                    className="shrink-0 p-1.5 rounded-md transition-opacity hover:opacity-70"
                    style={{ color: 'var(--fg-3)' }}
                    aria-label={`Remove ${lang === 'vi' ? item.food.nameVi : item.food.nameEn}`}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              onClick={() => { void handleConfirm() }}
              loading={isConfirming}
              className="w-full justify-center mt-1"
            >
              <CheckCircle size={15} />
              {t.nutrition.foodLogConfirm} ({pendingItems.length})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {isError && (
        <p className="text-sm text-center py-2" style={{ color: 'var(--xn-danger)' }}>
          {t.nutrition.foodLogError}
        </p>
      )}

      {data && (
        <FoodLogList date={dateStr} items={data.items} totals={data.totals} />
      )}

      <button
        type="button"
        onClick={() => setShowCustomDialog(true)}
        className="self-start flex items-center gap-1.5 text-xs mt-1"
        style={{ color: 'var(--fg-3)' }}
      >
        <PlusCircle size={13} />
        {t.nutrition.foodLogAddCustom}
      </button>

      {showCustomDialog && (
        <AddCustomFoodDialog
          onClose={() => setShowCustomDialog(false)}
          onCreated={handleCustomFoodCreated}
        />
      )}
    </div>
  )
}
