import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useCreateCustomFood } from '../../api/useFoodLog'
import type { FoodItemResponse } from '../../types'

const schema = z.object({
  nameVi: z.string().min(1, 'Bắt buộc nhập tên tiếng Việt'),
  nameEn: z.string().min(1, 'Bắt buộc nhập tên tiếng Anh'),
  caloriesPer100g: z.coerce.number().min(0),
  proteinPer100g: z.coerce.number().min(0),
  carbsPer100g: z.coerce.number().min(0),
  fatPer100g: z.coerce.number().min(0),
  defaultServingLabel: z.string().optional(),
  defaultServingGrams: z.coerce.number().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  onCreated: (food: FoodItemResponse) => void
}

export function AddCustomFoodDialog({ onClose, onCreated }: Props) {
  const createFood = useCreateCustomFood()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0 },
  })

  const onSubmit = async (data: FormData) => {
    const food = await createFood.mutateAsync(data)
    onCreated(food)
    onClose()
  }

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', zIndex: 9999 }}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: 'var(--fg-1)' }}>
            Thêm thức ăn mới
          </h3>
          <button type="button" onClick={onClose} style={{ color: 'var(--fg-3)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tên (tiếng Việt)" {...register('nameVi')} error={errors.nameVi?.message} />
            <Input label="Tên (tiếng Anh)" {...register('nameEn')} error={errors.nameEn?.message} />
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--fg-3)' }}>
            Dinh dưỡng / 100g
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Calories (kcal)" type="number" step="0.1" {...register('caloriesPer100g')} error={errors.caloriesPer100g?.message} />
            <Input label="Protein (g)" type="number" step="0.1" {...register('proteinPer100g')} error={errors.proteinPer100g?.message} />
            <Input label="Carbs (g)" type="number" step="0.1" {...register('carbsPer100g')} error={errors.carbsPer100g?.message} />
            <Input label="Fat (g)" type="number" step="0.1" {...register('fatPer100g')} error={errors.fatPer100g?.message} />
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--fg-3)' }}>
            Khẩu phần mặc định (tùy chọn)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tên khẩu phần" placeholder="vd: quả, lát, tô" {...register('defaultServingLabel')} />
            <Input label="Số gram" type="number" step="1" placeholder="vd: 200" {...register('defaultServingGrams')} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button type="submit" loading={createFood.isPending} className="flex-1">
              Lưu
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
