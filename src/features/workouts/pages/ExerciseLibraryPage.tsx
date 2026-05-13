import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen, Dumbbell, Lock, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Modal } from '@/shared/components/Modal'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { MuscleGroup, type MuscleGroup as MuscleGroupValue } from '@/shared/types/api'
import {
  useCreateCustomExerciseTemplate,
  useDeleteCustomExerciseTemplate,
  useExerciseTemplates,
  useUpdateCustomExerciseTemplate,
} from '../index'
import { useLocalizedExerciseName } from '../exerciseNames'
import { InlineTip } from '@/features/tips'
import { useAuthStore } from '@/features/auth'
import { useSubscription } from '@/features/billing/api/useSubscription'
import { useLangStore } from '@/shared/i18n'
import type { CustomExerciseTemplateRequest, ExerciseTemplateResponse } from '../types'

type ExerciseKindFilter = '' | 'Strength' | 'Cardio'

const customTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name is required').max(100),
  description: z.string().max(500).optional(),
  primaryMuscleGroup: z.enum(MuscleGroup),
  secondaryMuscleGroups: z.array(z.enum(MuscleGroup)).default([]),
  exerciseKind: z.enum(['Strength', 'Cardio']),
})

type CustomTemplateForm = z.output<typeof customTemplateSchema>

export function ExerciseLibraryPage() {
  const navigate = useNavigate()
  const lang = useLangStore((s) => s.lang)
  const tx = exerciseLibraryText(lang)
  const isAdmin = useAuthStore((s) => s.user?.roles?.includes('Admin') ?? false)
  const { data: subscription } = useSubscription()
  const isActivePro = isAdmin || (subscription?.isActive === true && subscription?.tier !== 'Free')

  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroupValue | ''>('')
  const [selectedType, setSelectedType] = useState<ExerciseKindFilter>('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ExerciseTemplateResponse | null>(null)

  const { data: templates = [], isLoading } = useExerciseTemplates({
    muscleGroup: selectedMuscleGroup || undefined,
  })
  const { data: allTemplates = [] } = useExerciseTemplates()
  const { mutate: createCustomTemplate, isPending: creatingCustom, error: createError } = useCreateCustomExerciseTemplate()
  const { mutate: updateCustomTemplate, isPending: updatingCustom, error: updateError } = useUpdateCustomExerciseTemplate()
  const { mutate: deleteCustomTemplate, isPending: deletingCustom } = useDeleteCustomExerciseTemplate()
  const { confirm, ConfirmDialog } = useConfirm()

  const form = useForm<z.input<typeof customTemplateSchema>, unknown, CustomTemplateForm>({
    resolver: zodResolver(customTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      primaryMuscleGroup: 'Chest',
      secondaryMuscleGroups: [],
      exerciseKind: 'Strength',
    },
  })

  const customCount = allTemplates.filter((template) => template.isCustom).length

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesType = !selectedType || template.exerciseKind === selectedType
      const matchesSearch =
        !query ||
        template.name.toLowerCase().includes(query) ||
        (template.description?.toLowerCase().includes(query) ?? false) ||
        template.primaryMuscleGroup.toLowerCase().includes(query) ||
        template.secondaryMuscleGroups.some((group) => group.toLowerCase().includes(query))

      return matchesType && matchesSearch
    })
  }, [search, selectedType, templates])

  const sharedCount = allTemplates.filter((template) => !template.isCustom).length

  function openCreateModal() {
    setEditingTemplate(null)
    form.reset({
      name: '',
      description: '',
      primaryMuscleGroup: selectedMuscleGroup || 'Chest',
      secondaryMuscleGroups: [],
      exerciseKind: 'Strength',
    })
    setModalOpen(true)
  }

  function openEditModal(template: ExerciseTemplateResponse) {
    setEditingTemplate(template)
    form.reset({
      name: template.name,
      description: template.description ?? '',
      primaryMuscleGroup: template.primaryMuscleGroup,
      secondaryMuscleGroups: template.secondaryMuscleGroups,
      exerciseKind: template.exerciseKind,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingTemplate(null)
    form.reset({
      name: '',
      description: '',
      primaryMuscleGroup: 'Chest',
      secondaryMuscleGroups: [],
      exerciseKind: 'Strength',
    })
  }

  function onSubmit(data: CustomTemplateForm) {
    const payload: CustomExerciseTemplateRequest = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      primaryMuscleGroup: data.primaryMuscleGroup,
      secondaryMuscleGroups: data.secondaryMuscleGroups.filter((group) => group !== data.primaryMuscleGroup),
      exerciseKind: data.exerciseKind,
    }

    if (editingTemplate) {
      updateCustomTemplate(
        { id: editingTemplate.id, data: payload },
        { onSuccess: closeModal },
      )
      return
    }

    createCustomTemplate(payload, { onSuccess: closeModal })
  }

  async function onDelete(template: ExerciseTemplateResponse) {
    const ok = await confirm(`Delete custom exercise "${template.name}"?`, {
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return

    deleteCustomTemplate(template.id)
  }

  const apiError = ((createError || updateError) as { response?: { data?: { message?: string } } } | null)
    ?.response?.data?.message

  return (
    <div className="space-y-6">
      {ConfirmDialog}

      <section
        className="relative z-20 overflow-visible rounded-3xl border"
        style={{
          borderColor: 'var(--xn-clay-300)',
          background: 'linear-gradient(135deg, var(--xn-clay-200), var(--bg-2) 58%, var(--xn-sage-100))',
          boxShadow: 'var(--sh-lg)',
        }}
      >
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(255,250,243,0.7)', color: 'var(--xn-clay-800)' }}>
              <BookOpen size={14} />
              {tx.badge}
            </div>
            <div className="flex items-start gap-2">
              <h1 className="font-display text-4xl font-bold leading-none text-text md:text-5xl">
                {tx.title}
              </h1>
              <InlineTip placement="exercise-library" />
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-base">
              {tx.subtitle}
            </p>
          </div>
          {isActivePro ? (
            <Button onClick={openCreateModal}>
              <Plus size={16} /> {tx.createCustom}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate('/subscription')}>
              <Lock size={16} /> {tx.createCustom}
            </Button>
          )}
        </div>
      </section>

      <div className="relative z-0 grid gap-4 md:grid-cols-3">
        <LibraryStat label={tx.sharedExercises} value={sharedCount.toString()} />
        <LibraryStat label={tx.customExercises} value={`${customCount}${isActivePro ? '' : '/0'}`} />
        <LibraryStat label={tx.showing} value={filteredTemplates.length.toString()} />
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tx.searchPlaceholder}
              className="xn-input w-full pr-10 text-sm"
              style={{ paddingLeft: '2.75rem' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                aria-label={tx.clearSearch}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Select
            options={Object.values(MuscleGroup).map((group) => ({ value: group, label: formatMuscleGroup(group, lang) }))}
            placeholder={tx.allMuscleGroups}
            value={selectedMuscleGroup}
            onChange={(next) => setSelectedMuscleGroup(next as MuscleGroupValue | '')}
          />
          <Select
            options={[
              { value: 'Strength', label: tx.strength },
              { value: 'Cardio', label: tx.cardio },
            ]}
            placeholder={tx.allTypes}
            value={selectedType}
            onChange={(next) => setSelectedType(next as ExerciseKindFilter)}
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="flex h-56 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-muted">{tx.noMatches}</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <ExerciseLibraryCard
              key={template.id}
              template={template}
              onEdit={openEditModal}
              onDelete={onDelete}
              deleting={deletingCustom}
              isActivePro={isActivePro}
              lang={lang}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTemplate ? tx.editCustomExercise : tx.createCustomExercise}
        className="max-w-lg"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={tx.exerciseName}
            placeholder={tx.exerciseNamePlaceholder}
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Input
            label={tx.description}
            placeholder={tx.descriptionPlaceholder}
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              name="primaryMuscleGroup"
              control={form.control}
              render={({ field }) => (
                <Select
                  label={tx.primaryMuscle}
                  options={Object.values(MuscleGroup).map((group) => ({ value: group, label: formatMuscleGroup(group, lang) }))}
                  value={field.value}
                  onChange={(next) => field.onChange(next as MuscleGroupValue)}
                />
              )}
            />
            <Controller
              name="exerciseKind"
              control={form.control}
              render={({ field }) => (
                <Select
                  label={tx.exerciseType}
                  options={[
                    { value: 'Strength', label: tx.strength },
                    { value: 'Cardio', label: tx.cardio },
                  ]}
                  value={field.value}
                  onChange={(next) => field.onChange(next || 'Strength')}
                />
              )}
            />
          </div>
          <Controller
            name="secondaryMuscleGroups"
            control={form.control}
            render={({ field }) => (
              <SecondaryMusclePicker
                value={field.value ?? []}
                primaryMuscleGroup={form.watch('primaryMuscleGroup')}
                onChange={field.onChange}
                lang={lang}
              />
            )}
          />
          {apiError && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--xn-danger-bg)', color: 'var(--xn-danger)' }}>
              {apiError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={creatingCustom || updatingCustom}>
              {editingTemplate ? tx.saveCustomExercise : tx.createCustomExercise}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function LibraryStat({ label, value }: { label: string; value: string }) {
  return (
    <Card
      className="flex items-center justify-between"
      style={{
        background: 'var(--bg-2)',
        borderColor: 'var(--xn-clay-300)',
        boxShadow: 'var(--sh-md)',
      }}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-3xl font-bold text-text">{value}</p>
    </Card>
  )
}

function ExerciseLibraryCard({
  template,
  onEdit,
  onDelete,
  deleting,
  isActivePro,
  lang,
}: {
  template: ExerciseTemplateResponse
  onEdit: (template: ExerciseTemplateResponse) => void
  onDelete: (template: ExerciseTemplateResponse) => void
  deleting: boolean
  isActivePro: boolean
  lang: 'en' | 'vi'
}) {
  const navigate = useNavigate()
  const localizeName = useLocalizedExerciseName()
  const tx = exerciseLibraryText(lang)
  return (
    <Card className="flex min-h-48 flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {template.imageUrl ? (
            <img
              src={`${import.meta.env.VITE_API_URL}${template.imageUrl}`}
              alt={template.name}
              className="h-11 w-11 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: template.isCustom ? 'var(--xn-clay-200)' : 'var(--xn-sage-200)', color: 'var(--xn-clay-800)' }}
            >
              <Dumbbell size={20} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-text">{localizeName(template.name)}</h2>
            <p className="text-sm text-muted">{formatMuscleGroup(template.primaryMuscleGroup, lang)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {template.isCustom && <Badge>{tx.custom}</Badge>}
          {template.exerciseKind === 'Cardio' && <Badge variant="primary">{tx.cardio}</Badge>}
        </div>
      </div>

      <p className="mb-4 line-clamp-3 flex-1 text-sm leading-6 text-muted">
        {template.description?.trim() || tx.noDescription}
      </p>

      {template.secondaryMuscleGroups.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {template.secondaryMuscleGroups.map((group) => (
            <span key={group} className="rounded-full px-2 py-1 text-xs" style={{ background: 'var(--bg-3)', color: 'var(--fg-3)' }}>
              {formatMuscleGroup(group, lang)}
            </span>
          ))}
        </div>
      )}

      {template.isCustom ? (
        <div className="mt-auto flex gap-2">
          {isActivePro ? (
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(template)}>
              <Pencil size={14} /> {tx.edit}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate('/subscription')}>
              <Lock size={14} /> {tx.edit}
            </Button>
          )}
          <Button variant="danger" size="sm" className="flex-1" loading={deleting} onClick={() => onDelete(template)}>
            <Trash2 size={14} /> {tx.delete}
          </Button>
        </div>
      ) : (
        <p className="mt-auto text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--xn-sage-700)' }}>
          {tx.xenohLibrary}
        </p>
      )}
    </Card>
  )
}

function SecondaryMusclePicker({
  value,
  primaryMuscleGroup,
  onChange,
  lang,
}: {
  value: MuscleGroupValue[]
  primaryMuscleGroup: MuscleGroupValue
  onChange: (value: MuscleGroupValue[]) => void
  lang: 'en' | 'vi'
}) {
  const selected = new Set(value.filter((group) => group !== primaryMuscleGroup))
  const tx = exerciseLibraryText(lang)

  function toggle(group: MuscleGroupValue) {
    const next = new Set(selected)
    if (next.has(group)) next.delete(group)
    else next.add(group)
    onChange([...next])
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>{tx.secondaryMuscles}</p>
      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border p-2" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-1)' }}>
        {Object.values(MuscleGroup)
          .filter((group) => group !== primaryMuscleGroup)
          .map((group) => {
            const isSelected = selected.has(group)
            return (
              <button
                key={group}
                type="button"
                onClick={() => toggle(group)}
                className="rounded-full border px-2.5 py-1 text-xs"
                style={{
                  borderColor: isSelected ? 'var(--xn-clay-600)' : 'var(--border-1)',
                  background: isSelected ? 'var(--xn-clay-200)' : 'var(--bg-2)',
                  color: isSelected ? 'var(--xn-clay-900)' : 'var(--fg-3)',
                }}
              >
                {formatMuscleGroup(group, lang)}
              </button>
            )
          })}
      </div>
    </div>
  )
}

function formatMuscleGroup(group: MuscleGroupValue, lang: 'en' | 'vi') {
  if (lang === 'vi') {
    const map: Partial<Record<MuscleGroupValue, string>> = {
      Chest: 'Ngực',
      Back: 'Lưng',
      Shoulders: 'Vai',
      Biceps: 'Tay trước',
      Triceps: 'Tay sau',
      Quads: 'Đùi trước',
      Hamstrings: 'Đùi sau',
      Glutes: 'Mông',
      Calves: 'Bắp chân',
      Abs: 'Bụng',
      Forearms: 'Cẳng tay',
      Traps: 'Cầu vai',
      FullBody: 'Toàn thân',
      Cardio: 'Cardio',
      Neck: 'Cổ',
      Adductors: 'Đùi trong',
      Abductors: 'Đùi ngoài',
    }
    return map[group] ?? group.replace(/([a-z])([A-Z])/g, '$1 $2')
  }
  return group.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function exerciseLibraryText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      badge: 'Thư viện bài tập',
      title: 'Tất cả động tác ở một nơi.',
      subtitle: 'Duyệt bài tập Xenoh, lọc theo nhóm cơ hoặc loại bài, và tạo bài custom không giới hạn với gói Pro.',
      createCustom: 'Tạo bài custom',
      sharedExercises: 'Bài tập chung',
      customExercises: 'Bài custom',
      showing: 'Đang hiển thị',
      searchPlaceholder: 'Tìm tên bài, mô tả hoặc nhóm cơ...',
      clearSearch: 'Xóa tìm kiếm',
      allMuscleGroups: 'Tất cả nhóm cơ',
      allTypes: 'Tất cả loại bài',
      strength: 'Sức mạnh',
      cardio: 'Cardio',
      noMatches: 'Không có bài tập phù hợp với bộ lọc.',
      editCustomExercise: 'Sửa bài custom',
      createCustomExercise: 'Tạo bài custom',
      exerciseName: 'Tên bài tập',
      exerciseNamePlaceholder: 'Incline dumbbell press',
      description: 'Mô tả',
      descriptionPlaceholder: 'Ghi chú tùy chọn cho động tác này',
      primaryMuscle: 'Nhóm cơ chính',
      exerciseType: 'Loại bài',
      secondaryMuscles: 'Nhóm cơ phụ',
      saveCustomExercise: 'Lưu bài custom',
      noDescription: 'Chưa có mô tả.',
      custom: 'Custom',
      edit: 'Sửa',
      delete: 'Xóa',
      xenohLibrary: 'Thư viện Xenoh',
    }
    : {
      badge: 'Exercise library',
      title: 'All movements in one place.',
      subtitle: 'Browse Xenoh exercises, filter by muscle group or type, and create unlimited custom exercises with a Pro subscription.',
      createCustom: 'Create custom',
      sharedExercises: 'Shared exercises',
      customExercises: 'Custom exercises',
      showing: 'Showing',
      searchPlaceholder: 'Search exercise name, description, or muscle...',
      clearSearch: 'Clear search',
      allMuscleGroups: 'All muscle groups',
      allTypes: 'All types',
      strength: 'Strength',
      cardio: 'Cardio',
      noMatches: 'No exercises match your filters.',
      editCustomExercise: 'Edit custom exercise',
      createCustomExercise: 'Create custom exercise',
      exerciseName: 'Exercise name',
      exerciseNamePlaceholder: 'Incline dumbbell press',
      description: 'Description',
      descriptionPlaceholder: 'Optional notes for this movement',
      primaryMuscle: 'Primary muscle',
      exerciseType: 'Exercise type',
      secondaryMuscles: 'Secondary muscles',
      saveCustomExercise: 'Save custom exercise',
      noDescription: 'No description yet.',
      custom: 'Custom',
      edit: 'Edit',
      delete: 'Delete',
      xenohLibrary: 'Xenoh Library',
    }
}
