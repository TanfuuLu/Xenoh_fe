import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ChevronLeft, Activity, Flame, Scale, Dumbbell, Plus, Ruler, CalendarDays, Users, ClipboardList, Utensils, Pencil, Trash2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Modal } from '@/shared/components/Modal'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { MuscleGroup, type MuscleGroup as MuscleGroupValue } from '@/shared/types/api'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { useLangStore, useT } from '@/shared/i18n'
import { useCoachPlanOverview, useCreatePlanForUser } from '@/features/plans'
import type { CreatePlanForUserRequest } from '@/features/plans'
import { useCoachDashboard } from '@/features/coach-client'
import {
  useClientExerciseTemplates,
  useCreateCustomExerciseTemplateForClient,
  useDeleteCustomExerciseTemplate,
  useUpdateCustomExerciseTemplate,
} from '@/features/workouts'
import type { CustomExerciseTemplateRequest, ExerciseTemplateResponse } from '@/features/workouts'
import { useClientBodyweightHistory, useClientProfile } from '../index'

const customTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name is required').max(100),
  description: z.string().max(500).optional(),
  primaryMuscleGroup: z.enum(MuscleGroup),
  secondaryMuscleGroups: z.array(z.enum(MuscleGroup)).default([]),
  exerciseKind: z.enum(['Strength', 'Cardio']),
})

type CustomTemplateForm = z.output<typeof customTemplateSchema>

const clientPlanSchema = z.object({
  name: z.string().trim().min(2, 'Plan name must be at least 2 characters').max(100),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

type ClientPlanForm = z.output<typeof clientPlanSchema>

export function ClientProfilePage() {
  const lang = useLangStore((s) => s.lang)
  const vx = clientProfileText(lang)
  const { clientId = '' } = useParams()
  const { data: profile, isLoading } = useClientProfile(clientId)
  const { data: bodyweightHistory = [] } = useClientBodyweightHistory(clientId)
  const { data: coachPlans = [], isLoading: plansLoading } = useCoachPlanOverview()
  const { data: dashboard = [] } = useCoachDashboard()
  const { data: clientExerciseTemplates = [], isLoading: clientExercisesLoading } =
    useClientExerciseTemplates(clientId)
  const { mutate: createClientPlan, isPending: creatingClientPlan, error: createClientPlanError } = useCreatePlanForUser()
  const { mutate: createForClient, isPending: creatingForClient, error: createForClientError } =
    useCreateCustomExerciseTemplateForClient(clientId)
  const { mutate: updateCustomTemplate, isPending: updatingCustom, error: updateError } = useUpdateCustomExerciseTemplate()
  const { mutate: deleteCustomTemplate, isPending: deletingCustom } = useDeleteCustomExerciseTemplate()
  const { confirm, ConfirmDialog } = useConfirm()
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ExerciseTemplateResponse | null>(null)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const t   = useT()
  const tp  = t.profile
  const tcp = t.clientProfile
  const tc  = t.common

  const exerciseForm = useForm<z.input<typeof customTemplateSchema>, unknown, CustomTemplateForm>({
    resolver: zodResolver(customTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      primaryMuscleGroup: 'Chest',
      secondaryMuscleGroups: [],
      exerciseKind: 'Strength',
    },
  })

  const planForm = useForm<z.input<typeof clientPlanSchema>, unknown, ClientPlanForm>({
    resolver: zodResolver(clientPlanSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
    },
  })

  function openPlanModal() {
    const startDate = format(new Date(), 'yyyy-MM-dd')
    const endDate = format(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    planForm.reset({
      name: `${profile?.firstName ?? vx.clientFallback} ${vx.defaultPlanSuffix}`,
      startDate,
      endDate,
    })
    setPlanModalOpen(true)
  }

  function closePlanModal() {
    setPlanModalOpen(false)
    planForm.reset()
  }

  function onSubmitPlan(data: ClientPlanForm) {
    const payload: CreatePlanForUserRequest = {
      userId: clientId,
      name: data.name.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
    }
    createClientPlan(payload, { onSuccess: closePlanModal })
  }

  function openExerciseModal() {
    setEditingTemplate(null)
    exerciseForm.reset({ name: '', description: '', primaryMuscleGroup: 'Chest', secondaryMuscleGroups: [], exerciseKind: 'Strength' })
    setExerciseModalOpen(true)
  }

  function openEditExerciseModal(template: ExerciseTemplateResponse) {
    setEditingTemplate(template)
    exerciseForm.reset({
      name: template.name,
      description: template.description ?? '',
      primaryMuscleGroup: template.primaryMuscleGroup,
      secondaryMuscleGroups: template.secondaryMuscleGroups,
      exerciseKind: template.exerciseKind,
    })
    setExerciseModalOpen(true)
  }

  function closeExerciseModal() {
    setExerciseModalOpen(false)
    setEditingTemplate(null)
    exerciseForm.reset()
  }

  function onSubmitExercise(data: CustomTemplateForm) {
    const payload: CustomExerciseTemplateRequest = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      primaryMuscleGroup: data.primaryMuscleGroup,
      secondaryMuscleGroups: data.secondaryMuscleGroups.filter((g) => g !== data.primaryMuscleGroup),
      exerciseKind: data.exerciseKind,
    }

    if (editingTemplate) {
      updateCustomTemplate(
        { id: editingTemplate.id, data: payload },
        { onSuccess: closeExerciseModal },
      )
      return
    }

    createForClient(payload, { onSuccess: closeExerciseModal })
  }

  async function onDeleteExercise(template: ExerciseTemplateResponse) {
    const ok = await confirm(`Delete custom exercise "${template.name}"?`, {
      confirmLabel: vx.delete,
      danger: true,
    })
    if (!ok) return

    deleteCustomTemplate(template.id)
  }

  const createForClientApiError = ((createForClientError || updateError) as { response?: { data?: { message?: string } } } | null)
    ?.response?.data?.message
  const createPlanApiError = (createClientPlanError as { response?: { data?: { message?: string } } } | null)
    ?.response?.data?.message

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) return <p className="text-muted">{tcp.notFound}</p>

  const genderLabel =
    profile.gender === 'Male'   ? tp.male   :
    profile.gender === 'Female' ? tp.female :
    profile.gender === 'Other'  ? tp.other  : tcp.noData
  const weightAnalytics = getWeightAnalytics(bodyweightHistory)

  const today = new Date()
  const clientPlans = coachPlans.filter((p) => p.ownerId === clientId)
  const clientDashboard = dashboard.find((entry) => entry.clientId === clientId)
  const planProgress = clientDashboard?.planProgressPercent ?? null
  const clientCustomExercises = clientExerciseTemplates.filter(
    (template) => template.isCustom && template.ownerId === clientId
  )
  const activePlan = clientPlans.find(
    (p) => today >= new Date(p.startDate) && today <= new Date(p.endDate)
  )
  const otherPlans = clientPlans.filter((p) => p.id !== activePlan?.id)

  return (
    <div className="space-y-6">
      {ConfirmDialog}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <Link to="/coach/clients">
            <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
          </Link>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-text">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="truncate text-sm text-muted">{profile.email}</p>
          </div>
        </div>
        <Link to={`/coach/clients/${clientId}/ai-insight`} className="self-start">
          <Button type="button" size="sm" variant="secondary">
            <Sparkles size={15} /> {vx.aiInsight}
          </Button>
        </Link>
      </div>

      {/* Key stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid gap-3 min-[390px]:grid-cols-2 md:grid-cols-4"
      >
        <StatCard
          icon={<Flame size={18} style={{ color: 'var(--color-warning)' }} />}
          label={tp.streakStat}
          value={`${profile.currentStreak} ${tc.days}`}
          highlight={profile.currentStreak > 0}
        />
        <StatCard
          icon={<Scale size={18} style={{ color: 'var(--color-primary)' }} />}
          label={vx.weight}
          value={profile.latestBodyweight ? `${profile.latestBodyweight} ${tcp.kg}` : tcp.noData}
        />
        <StatCard
          icon={<Activity size={18} style={{ color: 'var(--color-success)' }} />}
          label={tp.bmiStat}
          value={profile.bmi ? `${profile.bmi.toFixed(1)} (${profile.bmiCategory ?? ''})` : tcp.noData}
        />
        <StatCard
          icon={<Dumbbell size={18} style={{ color: 'var(--xn-clay-600)' }} />}
          label={tp.dotsStat}
          value={profile.dotsScore ? profile.dotsScore.toFixed(1) : tcp.noData}
        />
      </motion.div>

      {/* Personal info */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          {tcp.statsHeading}
        </h2>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid gap-4 min-[390px]:grid-cols-2 md:grid-cols-3"
        >
          <motion.div variants={slideUp}>
            <InfoRow
              icon={<Ruler size={15} />}
              label={tp.heightStat}
              value={profile.height ? `${profile.height} ${tcp.cm}` : tcp.noData}
            />
          </motion.div>
          <motion.div variants={slideUp}>
            <InfoRow
              icon={<Users size={15} />}
              label={tp.genderStat}
              value={genderLabel}
            />
          </motion.div>
          <motion.div variants={slideUp}>
            <InfoRow
              icon={<CalendarDays size={15} />}
              label={tp.dobStat}
              value={
                profile.dateOfBirth
                  ? format(new Date(profile.dateOfBirth), 'dd/MM/yyyy')
                  : tcp.noData
              }
            />
          </motion.div>
        </motion.div>
      </Card>

      {/* Training plan */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted">
            <ClipboardList size={14} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">{vx.trainingPlan}</h2>
          </div>
          <Button size="sm" onClick={openPlanModal}>
            <Plus size={14} /> {vx.createPlan}
          </Button>
        </div>
        <div className="mb-4 rounded-xl border border-border p-4" style={{ background: 'var(--bg-2)' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">{vx.clientPlanProgress}</p>
              <p className="mt-0.5 text-xs text-muted">
                {activePlan ? activePlan.name : vx.noActivePlanInRange}
              </p>
            </div>
            <p className="text-2xl font-bold text-text">
              {planProgress !== null ? `${planProgress}%` : '-'}
            </p>
          </div>
          {planProgress !== null && (
            <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'var(--xn-clay-200)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, planProgress))}%` }}
                className="h-full rounded-full"
                style={{ background: 'var(--xn-clay-700)' }}
              />
            </div>
          )}
        </div>
        {plansLoading ? (
          <Spinner size="sm" />
        ) : clientPlans.length === 0 ? (
          <div className="rounded-xl border border-border p-4" style={{ background: 'var(--bg-2)' }}>
            <p className="text-sm text-muted">{vx.noPlanAssigned}</p>
            <Button size="sm" className="mt-3" onClick={openPlanModal}>
              <Plus size={14} /> {vx.createFirstPlan}
            </Button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-3"
          >
            {activePlan && (
              <Link to={`/plans/${activePlan.id}`} state={{ canEdit: true }}>
                <motion.div
                  variants={slideUp}
                  className="rounded-xl border p-4 transition-opacity hover:opacity-80"
                  style={{ borderColor: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="break-words font-semibold text-text">{activePlan.name}</p>
                      <p className="text-xs text-muted">
                        {format(new Date(activePlan.startDate), 'dd/MM/yyyy')} – {format(new Date(activePlan.endDate), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-xs text-muted">{activePlan.totalWeeks} {vx.weeks}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}
                    >
                      {vx.active}
                    </span>
                  </div>
                </motion.div>
              </Link>
            )}
            {otherPlans.map((plan) => (
              <Link key={plan.id} to={`/plans/${plan.id}`} state={{ canEdit: true }}>
                <motion.div
                  variants={slideUp}
                  className="rounded-xl border border-border p-4 transition-opacity hover:opacity-80"
                  style={{ background: 'var(--bg-2)' }}
                >
                  <p className="break-words font-medium text-text">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {format(new Date(plan.startDate), 'dd/MM/yyyy')} – {format(new Date(plan.endDate), 'dd/MM/yyyy')}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{plan.totalWeeks} {vx.weeks}</p>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}
      </Card>

      <Modal
        open={planModalOpen}
        onClose={closePlanModal}
        title={vx.createPlanForClient}
        className="max-w-lg"
      >
        <form onSubmit={planForm.handleSubmit(onSubmitPlan)} className="space-y-4">
          <Input
            label={vx.planName}
            placeholder="Hypertrophy Block"
            error={planForm.formState.errors.name?.message}
            {...planForm.register('name')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={vx.startDate}
              type="date"
              error={planForm.formState.errors.startDate?.message}
              {...planForm.register('startDate')}
            />
            <Input
              label={vx.endDate}
              type="date"
              error={planForm.formState.errors.endDate?.message}
              {...planForm.register('endDate')}
            />
          </div>
          {createPlanApiError && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--xn-danger-bg)', color: 'var(--xn-danger)' }}>
              {createPlanApiError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closePlanModal}>
              {vx.cancel}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={creatingClientPlan}>
              {vx.createPlan}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Custom exercises for client */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-muted">
            <Dumbbell size={14} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">{vx.customExercisesForClient}</h2>
          </div>
          <Button size="sm" onClick={openExerciseModal}>
            <Plus size={14} /> {vx.addExercise}
          </Button>
        </div>
        <p className="text-sm text-muted">
          {vx.customExerciseHint}
        </p>
        <div className="mt-4">
          {clientExercisesLoading ? (
            <Spinner size="sm" />
          ) : clientCustomExercises.length === 0 ? (
            <p className="text-sm text-muted">{vx.noCustomExercises}</p>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid gap-3 md:grid-cols-2"
            >
              {clientCustomExercises.map((template) => (
                <motion.div
                  key={template.id}
                  variants={slideUp}
                  className="rounded-xl border border-border p-4"
                  style={{ background: 'var(--bg-2)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-text">{template.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatMuscleGroup(template.primaryMuscleGroup, lang)} • {translateExerciseKind(template.exerciseKind, lang)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditExerciseModal(template)}
                        title={vx.editCustomExercise}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={deletingCustom}
                        onClick={() => onDeleteExercise(template)}
                        title={vx.deleteCustomExercise}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  {template.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted">{template.description}</p>
                  )}
                  {template.secondaryMuscleGroups.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {template.secondaryMuscleGroups.map((group) => (
                        <span
                          key={group}
                          className="rounded-full border px-2 py-0.5 text-xs text-muted"
                          style={{ borderColor: 'var(--border-1)' }}
                        >
                          {formatMuscleGroup(group, lang)}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Utensils size={18} className="mt-0.5 text-primary" />
            <div>
              <h2 className="font-semibold text-text">{vx.nutrition}</h2>
              <p className="mt-1 text-sm text-muted">{vx.nutritionHint}</p>
            </div>
          </div>
          <Link to={`/coach/clients/${clientId}/nutrition`}>
            <Button size="sm">{vx.openNutrition}</Button>
          </Link>
        </div>
      </Card>

      <Modal
        open={exerciseModalOpen}
        onClose={closeExerciseModal}
        title={editingTemplate ? vx.editCustomExerciseForClient : vx.createCustomExerciseForClient}
        className="max-w-lg"
      >
        <form onSubmit={exerciseForm.handleSubmit(onSubmitExercise)} className="space-y-4">
          <Input
            label={vx.exerciseName}
            placeholder="Incline dumbbell press"
            error={exerciseForm.formState.errors.name?.message}
            {...exerciseForm.register('name')}
          />
          <Input
            label={vx.description}
            placeholder="Optional notes for this movement"
            error={exerciseForm.formState.errors.description?.message}
            {...exerciseForm.register('description')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              name="primaryMuscleGroup"
              control={exerciseForm.control}
              render={({ field }) => (
                <Select
                  label={vx.primaryMuscle}
                  options={Object.values(MuscleGroup).map((g) => ({ value: g, label: formatMuscleGroup(g, lang) }))}
                  value={field.value}
                  onChange={(next) => field.onChange(next as MuscleGroupValue)}
                />
              )}
            />
            <Controller
              name="exerciseKind"
              control={exerciseForm.control}
              render={({ field }) => (
                <Select
                  label={vx.exerciseType}
                  options={[
                    { value: 'Strength', label: vx.strength },
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
            control={exerciseForm.control}
            render={({ field }) => (
              <SecondaryMusclePicker
                value={field.value ?? []}
                primaryMuscleGroup={exerciseForm.watch('primaryMuscleGroup')}
                onChange={field.onChange}
                lang={lang}
                label={vx.secondaryMuscles}
              />
            )}
          />
          {createForClientApiError && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--xn-danger-bg)', color: 'var(--xn-danger)' }}>
              {createForClientApiError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeExerciseModal}>
              {vx.cancel}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={creatingForClient || updatingCustom}>
              {editingTemplate ? vx.saveExercise : vx.createExercise}
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text">{vx.bodyweightAnalysis}</h2>
            <p className="text-sm text-muted">{vx.last90Days}</p>
          </div>
          {weightAnalytics.latest != null && (
            <p className="text-2xl font-bold text-text">{weightAnalytics.latest} {tcp.kg}</p>
          )}
        </div>

        {weightAnalytics.chartData.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <AnalysisStat label={vx.entries} value={weightAnalytics.entryCount.toString()} />
              <AnalysisStat
                label={vx.totalChange}
                value={formatWeightDelta(weightAnalytics.totalChange, tcp.kg)}
              />
              <AnalysisStat
                label={vx.avgChange}
                value={formatWeightDelta(weightAnalytics.averageChange, tcp.kg)}
              />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightAnalytics.chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                  <XAxis dataKey="dateLabel" tick={{ fill: 'var(--fg-3)', fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: 'var(--fg-3)', fontSize: 12 }}
                    domain={['auto', 'auto']}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--fg-1)' }}
                    itemStyle={{ color: 'var(--xn-clay-800)' }}
                    formatter={(value) => [`${value} ${tcp.kg}`, vx.weight]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--xn-clay-800)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--xn-clay-800)', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">{vx.noBodyweightLogs}</p>
        )}
      </Card>
    </div>
  )
}

function getWeightAnalytics(history: { weight: number; date: string }[]) {
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const chartData = sorted.map((entry) => ({
    dateLabel: format(new Date(entry.date), 'dd/MM'),
    weight: entry.weight,
  }))
  const first = sorted[0]?.weight
  const latest = sorted.length > 0 ? sorted[sorted.length - 1].weight : undefined
  const totalChange = first != null && latest != null ? latest - first : 0
  const averageChange = sorted.length > 1 ? totalChange / (sorted.length - 1) : 0

  return {
    chartData,
    entryCount: sorted.length,
    latest,
    totalChange,
    averageChange,
  }
}

function formatWeightDelta(value: number, unit: string) {
  const rounded = Math.abs(value) < 0.05 ? 0 : Number(value.toFixed(1))
  if (rounded === 0) return `0 ${unit}`
  return `${rounded > 0 ? '+' : ''}${rounded} ${unit}`
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <motion.div
      variants={slideUp}
      className="rounded-xl border p-4 space-y-2"
      style={{
        borderColor: highlight ? 'var(--xn-warning)' : 'var(--border-1)',
        background: highlight ? 'var(--xn-warning-bg)' : 'var(--bg-2)',
      }}
    >
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-text">{value}</p>
    </motion.div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-medium text-text">{value}</p>
      </div>
    </div>
  )
}

function AnalysisStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-text">{value}</p>
    </div>
  )
}

function clientProfileText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      aiInsight: 'AI phân tích',
      weight: 'Cân nặng',
      trainingPlan: 'Plan tập luyện',
      createPlan: 'Tạo plan',
      clientPlanProgress: 'Tiến độ plan của client',
      noActivePlanInRange: 'Không có plan hoạt động trong khoảng ngày',
      noPlanAssigned: 'Chưa gán plan.',
      createFirstPlan: 'Tạo plan đầu tiên',
      weeks: 'tuần',
      active: 'Đang hoạt động',
      createPlanForClient: 'Tạo plan cho client',
      planName: 'Tên plan',
      startDate: 'Ngày bắt đầu',
      endDate: 'Ngày kết thúc',
      cancel: 'Hủy',
      customExercisesForClient: 'Bài custom cho client',
      addExercise: 'Thêm bài tập',
      customExerciseHint: 'Tạo bài tập custom sẽ xuất hiện trong thư viện bài tập của client này.',
      noCustomExercises: 'Chưa tạo bài custom nào cho client này.',
      editCustomExercise: 'Sửa bài custom',
      deleteCustomExercise: 'Xóa bài custom',
      nutrition: 'Dinh dưỡng',
      nutritionHint: 'Chỉnh TDEE, mục tiêu bulk/cut và log ăn uống hằng ngày của client này.',
      openNutrition: 'Mở dinh dưỡng',
      editCustomExerciseForClient: 'Sửa bài custom cho client',
      createCustomExerciseForClient: 'Tạo bài custom cho client',
      exerciseName: 'Tên bài tập',
      description: 'Mô tả',
      primaryMuscle: 'Nhóm cơ chính',
      exerciseType: 'Loại bài',
      strength: 'Sức mạnh',
      secondaryMuscles: 'Nhóm cơ phụ',
      saveExercise: 'Lưu bài tập',
      createExercise: 'Tạo bài tập',
      bodyweightAnalysis: 'Phân tích cân nặng',
      last90Days: '90 ngày gần nhất',
      entries: 'Số lần ghi',
      totalChange: 'Tổng thay đổi',
      avgChange: 'Thay đổi TB',
      noBodyweightLogs: 'Chưa có log cân nặng.',
      clientFallback: 'Client',
      defaultPlanSuffix: 'Plan tập luyện',
      delete: 'Xóa',
    }
    : {
      aiInsight: 'AI Insight',
      weight: 'Weight',
      trainingPlan: 'Training Plan',
      createPlan: 'Create plan',
      clientPlanProgress: 'Client plan progress',
      noActivePlanInRange: 'No active plan in date range',
      noPlanAssigned: 'No plan assigned yet.',
      createFirstPlan: 'Create first plan',
      weeks: 'weeks',
      active: 'Active',
      createPlanForClient: 'Create plan for client',
      planName: 'Plan name',
      startDate: 'Start date',
      endDate: 'End date',
      cancel: 'Cancel',
      customExercisesForClient: 'Custom exercises for client',
      addExercise: 'Add exercise',
      customExerciseHint: "Create a custom exercise that will appear in this client's exercise library.",
      noCustomExercises: 'No custom exercises created for this client yet.',
      editCustomExercise: 'Edit custom exercise',
      deleteCustomExercise: 'Delete custom exercise',
      nutrition: 'Nutrition',
      nutritionHint: "Edit this client's TDEE, bulk/cut targets, and daily intake logs.",
      openNutrition: 'Open nutrition',
      editCustomExerciseForClient: 'Edit custom exercise for client',
      createCustomExerciseForClient: 'Create custom exercise for client',
      exerciseName: 'Exercise name',
      description: 'Description',
      primaryMuscle: 'Primary muscle',
      exerciseType: 'Exercise type',
      strength: 'Strength',
      secondaryMuscles: 'Secondary muscles',
      saveExercise: 'Save exercise',
      createExercise: 'Create exercise',
      bodyweightAnalysis: 'Bodyweight analysis',
      last90Days: 'Last 90 days',
      entries: 'Entries',
      totalChange: 'Total change',
      avgChange: 'Avg change',
      noBodyweightLogs: 'No bodyweight logs yet.',
      clientFallback: 'Client',
      defaultPlanSuffix: 'Training Plan',
      delete: 'Delete',
    }
}

function formatMuscleGroup(group: MuscleGroupValue, lang: 'en' | 'vi') {
  if (lang === 'vi') {
    const map: Partial<Record<MuscleGroupValue, string>> = {
      Chest: 'Ngực',
      Back: 'Lưng',
      Shoulders: 'Vai',
      Biceps: 'Tay trước',
      Triceps: 'Tay sau',
      Forearms: 'Cẳng tay',
      Abs: 'Bụng',
      Glutes: 'Mông',
      Quads: 'Đùi trước',
      Hamstrings: 'Đùi sau',
      Calves: 'Bắp chân',
      FullBody: 'Toàn thân',
      Cardio: 'Cardio',
      Traps: 'Cầu vai',
      Neck: 'Cổ',
      Adductors: 'Đùi trong',
      Abductors: 'Đùi ngoài',
    }
    return map[group] ?? group.replace(/([a-z])([A-Z])/g, '$1 $2')
  }
  return group.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function translateExerciseKind(kind: string, lang: 'en' | 'vi') {
  if (lang !== 'vi') return kind
  return kind === 'Strength' ? 'Sức mạnh' : kind
}

function SecondaryMusclePicker({
  value,
  primaryMuscleGroup,
  onChange,
  lang,
  label,
}: {
  value: MuscleGroupValue[]
  primaryMuscleGroup: MuscleGroupValue
  onChange: (value: MuscleGroupValue[]) => void
  lang: 'en' | 'vi'
  label: string
}) {
  const selected = new Set(value.filter((g) => g !== primaryMuscleGroup))

  function toggle(group: MuscleGroupValue) {
    const next = new Set(selected)
    if (next.has(group)) next.delete(group)
    else next.add(group)
    onChange([...next])
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>{label}</p>
      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border p-2" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-1)' }}>
        {Object.values(MuscleGroup)
          .filter((g) => g !== primaryMuscleGroup)
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
