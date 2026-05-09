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
        className="overflow-hidden rounded-3xl border"
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
              Exercise library
            </div>
            <h1 className="font-display text-4xl font-bold leading-none text-text md:text-5xl">
              All movements in one place.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-base">
              Browse Xenoh exercises, filter by muscle group or type, and create unlimited custom exercises with a Pro subscription.
            </p>
          </div>
          {isActivePro ? (
            <Button onClick={openCreateModal}>
              <Plus size={16} /> Create custom
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate('/subscription')}>
              <Lock size={16} /> Create custom
            </Button>
          )}
        </div>
      </section>

      <InlineTip placement="exercise-library" />

      <div className="grid gap-4 md:grid-cols-3">
        <LibraryStat label="Shared exercises" value={sharedCount.toString()} />
        <LibraryStat label="Custom exercises" value={`${customCount}${isActivePro ? '' : '/0'}`} />
        <LibraryStat label="Showing" value={filteredTemplates.length.toString()} />
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search exercise name, description, or muscle..."
              className="xn-input w-full pr-10 text-sm"
              style={{ paddingLeft: '2.75rem' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Select
            options={Object.values(MuscleGroup).map((group) => ({ value: group, label: formatMuscleGroup(group) }))}
            placeholder="All muscle groups"
            value={selectedMuscleGroup}
            onChange={(next) => setSelectedMuscleGroup(next as MuscleGroupValue | '')}
          />
          <Select
            options={[
              { value: 'Strength', label: 'Strength' },
              { value: 'Cardio', label: 'Cardio' },
            ]}
            placeholder="All types"
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
          <p className="text-center text-sm text-muted">No exercises match your filters.</p>
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
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTemplate ? 'Edit custom exercise' : 'Create custom exercise'}
        className="max-w-lg"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Exercise name"
            placeholder="Incline dumbbell press"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Input
            label="Description"
            placeholder="Optional notes for this movement"
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              name="primaryMuscleGroup"
              control={form.control}
              render={({ field }) => (
                <Select
                  label="Primary muscle"
                  options={Object.values(MuscleGroup).map((group) => ({ value: group, label: formatMuscleGroup(group) }))}
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
                  label="Exercise type"
                  options={[
                    { value: 'Strength', label: 'Strength' },
                    { value: 'Cardio', label: 'Cardio' },
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
              {editingTemplate ? 'Save custom exercise' : 'Create custom exercise'}
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
}: {
  template: ExerciseTemplateResponse
  onEdit: (template: ExerciseTemplateResponse) => void
  onDelete: (template: ExerciseTemplateResponse) => void
  deleting: boolean
  isActivePro: boolean
}) {
  const navigate = useNavigate()
  const localizeName = useLocalizedExerciseName()
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
            <p className="text-sm text-muted">{formatMuscleGroup(template.primaryMuscleGroup)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {template.isCustom && <Badge>Custom</Badge>}
          {template.exerciseKind === 'Cardio' && <Badge variant="primary">Cardio</Badge>}
        </div>
      </div>

      <p className="mb-4 line-clamp-3 flex-1 text-sm leading-6 text-muted">
        {template.description?.trim() || 'No description yet.'}
      </p>

      {template.secondaryMuscleGroups.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {template.secondaryMuscleGroups.map((group) => (
            <span key={group} className="rounded-full px-2 py-1 text-xs" style={{ background: 'var(--bg-3)', color: 'var(--fg-3)' }}>
              {formatMuscleGroup(group)}
            </span>
          ))}
        </div>
      )}

      {template.isCustom ? (
        <div className="mt-auto flex gap-2">
          {isActivePro ? (
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(template)}>
              <Pencil size={14} /> Edit
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate('/subscription')}>
              <Lock size={14} /> Edit
            </Button>
          )}
          <Button variant="danger" size="sm" className="flex-1" loading={deleting} onClick={() => onDelete(template)}>
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      ) : (
        <p className="mt-auto text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--xn-sage-700)' }}>
          Xenoh Library
        </p>
      )}
    </Card>
  )
}

function SecondaryMusclePicker({
  value,
  primaryMuscleGroup,
  onChange,
}: {
  value: MuscleGroupValue[]
  primaryMuscleGroup: MuscleGroupValue
  onChange: (value: MuscleGroupValue[]) => void
}) {
  const selected = new Set(value.filter((group) => group !== primaryMuscleGroup))

  function toggle(group: MuscleGroupValue) {
    const next = new Set(selected)
    if (next.has(group)) next.delete(group)
    else next.add(group)
    onChange([...next])
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>Secondary muscles</p>
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
                {formatMuscleGroup(group)}
              </button>
            )
          })}
      </div>
    </div>
  )
}

function formatMuscleGroup(group: MuscleGroupValue) {
  return group.replace(/([a-z])([A-Z])/g, '$1 $2')
}
