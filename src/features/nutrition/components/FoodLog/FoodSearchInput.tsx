import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Search, Sparkles } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { scaleIn } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useFoodSearch, useResolveFood } from '../../api/useFoodLog'
import type { FoodItemResponse } from '../../types'

interface Props {
  onSelect: (food: FoodItemResponse) => void
}

export function FoodSearchInput({ onSelect }: Props) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const { data: results, isFetching } = useFoodSearch(query)
  const resolveFood = useResolveFood()

  // Compute dropdown position from the wrapper rect
  useEffect(() => {
    if (!open || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [open, query])

  const handleSelect = (food: FoodItemResponse) => {
    onSelect(food)
    setQuery('')
    setOpen(false)
  }

  const handleResolve = async () => {
    if (!query.trim()) return
    const food = await resolveFood.mutateAsync(query.trim())
    handleSelect(food)
  }

  const showDropdown = open && query.trim().length >= 2
  const hasResults = results && results.length > 0

  const dropdown = (
    <AnimatePresence>
      {showDropdown && (
        <motion.div
          {...(!shouldReduceMotion ? { initial: 'hidden', animate: 'visible', exit: 'hidden', variants: scaleIn } : {})}
          style={{
            ...dropdownStyle,
            background: 'var(--bg-3)',
            border: '1px solid var(--border-1)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {isFetching && (
              <div className="px-3 py-2 text-sm" style={{ color: 'var(--fg-3)' }}>
                {t.nutrition.foodLogSearching}
              </div>
            )}

            {!isFetching && hasResults && results.map((food) => (
              <button
                key={food.id}
                type="button"
                onMouseDown={() => handleSelect(food)}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/6 select-none cursor-pointer"
                style={{ color: 'var(--fg-1)' }}
              >
                <span className="font-medium truncate">{food.nameVi}</span>
                <span className="ml-3 shrink-0 text-xs" style={{ color: 'var(--fg-3)' }}>
                  {food.nameEn && <span className="mr-2">{food.nameEn}</span>}
                  {Math.round(food.caloriesPer100g)} kcal/100g
                </span>
              </button>
            ))}

            {!isFetching && !hasResults && query.trim().length >= 2 && (
              <div className="px-3 py-2">
                <p className="text-sm mb-2" style={{ color: 'var(--fg-3)' }}>
                  {t.nutrition.foodLogNotFound.replace('{query}', query)}
                </p>
                <button
                  type="button"
                  onMouseDown={handleResolve}
                  disabled={resolveFood.isPending}
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  <Sparkles size={14} />
                  {resolveFood.isPending ? t.nutrition.foodLogAiLooking : t.nutrition.foodLogAiLookup}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div ref={wrapperRef} className={cn('relative', open && 'z-10')}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--fg-3)' }}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t.nutrition.foodLogSearchPlaceholder}
          className={cn('xn-input w-full')}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}
