import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useT } from '@/shared/i18n'
import { useCreateCustomFood } from '../../api/useFoodLog'
import type { FoodItemResponse } from '../../types'

interface FormData {
  nameVi: string
  nameEn: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  defaultServingLabel?: string
  defaultServingGrams?: number
}

interface Props {
  onClose: () => void
  onCreated: (food: FoodItemResponse) => void
}

export function AddCustomFoodDialog({ onClose, onCreated }: Props) {
  const createFood = useCreateCustomFood()
  const t = useT()
  const tn = t.nutrition

  const schema = z.object({
    nameVi: z.string().min(1, tn.addCustomFoodErrorNameVi),
    nameEn: z.string().min(1, tn.addCustomFoodErrorNameEn),
    caloriesPer100g: z.coerce.number().min(0),
    proteinPer100g: z.coerce.number().min(0),
    carbsPer100g: z.coerce.number().min(0),
    fatPer100g: z.coerce.number().min(0),
    defaultServingLabel: z.string().optional(),
    defaultServingGrams: z.coerce.number().optional(),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<z.input<typeof schema>, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0 },
  })

  const onSubmit = async (data: FormData) => {
    const food = await createFood.mutateAsync(data)
    onCreated(food)
    onClose()
  }

  const content = (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 10000 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          key="card"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 26, stiffness: 340, mass: 0.6 } }}
          exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.15 } }}
          className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border-1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border-1)' }}
          >
            <h3 className="text-base font-semibold" style={{ color: 'var(--fg-1)' }}>
              {tn.addCustomFoodTitle}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'var(--fg-3)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto" style={{ maxHeight: 'min(calc(100dvh - 140px), 520px)' }}>
            <form id="add-custom-food-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-5 py-5">

              {/* Names */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                  {tn.addCustomFoodNameVi} / {tn.addCustomFoodNameEn}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={tn.addCustomFoodNameVi}
                    placeholder="vd: Ức gà luộc"
                    {...register('nameVi')}
                    error={errors.nameVi?.message}
                  />
                  <Input
                    label={tn.addCustomFoodNameEn}
                    placeholder="e.g. Boiled chicken"
                    {...register('nameEn')}
                    error={errors.nameEn?.message}
                  />
                </div>
              </div>

              {/* Nutrition per 100g */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                  {tn.addCustomFoodNutrition}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Calories (kcal)" type="number" min="0" step="0.1" {...register('caloriesPer100g')} error={errors.caloriesPer100g?.message} />
                  <Input label="Protein (g)" type="number" min="0" step="0.1" {...register('proteinPer100g')} error={errors.proteinPer100g?.message} />
                  <Input label="Carbs (g)" type="number" min="0" step="0.1" {...register('carbsPer100g')} error={errors.carbsPer100g?.message} />
                  <Input label="Fat (g)" type="number" min="0" step="0.1" {...register('fatPer100g')} error={errors.fatPer100g?.message} />
                </div>
              </div>

              {/* Default serving (optional) */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                  {tn.addCustomFoodServing}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={tn.addCustomFoodServingLabel}
                    placeholder={tn.addCustomFoodServingLabelPlaceholder}
                    {...register('defaultServingLabel')}
                  />
                  <Input
                    label={tn.addCustomFoodServingGrams}
                    type="number"
                    min="0"
                    step="1"
                    placeholder={tn.addCustomFoodServingGramsPlaceholder}
                    {...register('defaultServingGrams')}
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div
            className="flex gap-3 px-5 py-4 border-t"
            style={{ borderColor: 'var(--border-1)' }}
          >
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">
              {tn.foodLogCancel}
            </Button>
            <Button
              type="submit"
              form="add-custom-food-form"
              loading={createFood.isPending}
              className="flex-1 justify-center"
            >
              {tn.addCustomFoodSave}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
