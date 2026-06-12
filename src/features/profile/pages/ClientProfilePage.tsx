import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ChevronLeft, Activity, Flame, Scale, Dumbbell, Plus, Lock, Ruler, CalendarDays, Users, ClipboardList, Utensils, Pencil, Trash2, Sparkles, Target, Trophy, CalendarHeart, ArrowRight } from 'lucide-react'
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
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import { MuscleGroup, type MuscleGroup as MuscleGroupValue } from '@/shared/types/api'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { useLangStore, useT } from '@/shared/i18n'
import { useCoachPlanOverview, useCreatePlanForUser } from '@/features/plans'
import type { CreatePlanForUserRequest } from '@/features/plans'
import { useCoachDashboard } from '@/features/coach-client'
import { useClientCycleOverview } from '@/features/cycle'
import {
  useClientExerciseTemplates,
  useCreateCustomExerciseTemplateForClient,
  useDeleteCustomExerciseTemplate,
  useUpdateCustomExerciseTemplate,
} from '@/features/workouts'
import type { CustomExerciseTemplateRequest, ExerciseTemplateResponse } from '@/features/workouts'
import { useAuthStore } from '@/features/auth'
import { useSubscription } from '@/features/billing/api/useSubscription'
import { getApiErrorMessage } from '@/shared/api/errorMessage'
import { useClientBodyweightHistory, useClientProfile } from '../index'
import { StatCard, InfoRow, AnalysisStat } from '../components/ClientProfileCards'
import { SecondaryMusclePicker } from '../components/SecondaryMusclePicker'
import {
  clientProfileText,
  getWeightAnalytics,
  formatWeightDelta,
  formatMuscleGroup,
  translateExerciseKind,
} from '../components/clientProfileHelpers'

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

function formatProfileOption<T extends string>(
  value: T | null | undefined,
  labels: Record<T, string>,
  fallback: string,
) {
  return value ? labels[value] ?? value : fallback
}

export function ClientProfilePage() {
  const lang = useLangStore((s) => s.lang)
  const vx = clientProfileText(lang)
  const navigate = useNavigate()
  const { clientId = '' } = useParams()
  const isAdmin = useAuthStore((s) => s.user?.roles?.includes('Admin') ?? false)
  const { data: subscription } = useSubscription()
  // Creating exercises for a client hits the RequireProCoach policy on the API.
  // Gate the button on the same condition so coaches without an active ProCoach
  // plan aren't shown a modal whose submit is guaranteed to 403.
  const isProCoach =
    isAdmin || (subscription?.isActive === true && subscription?.tier === 'ProCoach')
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
  // Succeeds only when the client is Female and has opted in to sharing; 404 otherwise → tile hidden.
  const { data: clientCycle } = useClientCycleOverview(clientId)
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

  const exerciseError = createForClientError || updateError
  const createForClientApiError = exerciseError
    ? getApiErrorMessage(exerciseError, vx.exerciseSaveError, vx.proCoachRequired)
    : undefined
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
          icon={<Flame size={18} style={{ color: 'var(--ic-orange)' }} />}
          label={tp.streakStat}
          value={`${profile.currentStreak} ${tc.days}`}
          highlight={profile.currentStreak > 0}
        />
        <StatCard
          icon={<Scale size={18} style={{ color: 'var(--ic-blue)' }} />}
          label={vx.weight}
          value={profile.latestBodyweight ? `${profile.latestBodyweight} ${tcp.kg}` : tcp.noData}
        />
        <StatCard
          icon={<Activity size={18} style={{ color: 'var(--ic-green)' }} />}
          label={tp.bmiStat}
          value={profile.bmi ? `${profile.bmi.toFixed(1)} (${profile.bmiCategory ?? ''})` : tcp.noData}
        />
        <StatCard
          icon={<Dumbbell size={18} style={{ color: 'var(--ic-purple)' }} />}
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
          <motion.div variants={slideUp}>
            <InfoRow
              icon={<Target size={15} />}
              label={tp.developmentDirectionStat}
              value={formatProfileOption(profile.developmentDirection, tp.developmentDirections, tcp.noData)}
            />
          </motion.div>
          <motion.div variants={slideUp}>
            <InfoRow
              icon={<Trophy size={15} />}
              label={tp.trainingDisciplineStat}
              value={formatProfileOption(profile.trainingDiscipline, tp.trainingDisciplines, tcp.noData)}
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
          <div className="flex items-center gap-2">
            {activePlan && (
              <Link to={`/coach/clients/${clientId}/today-workout?planId=${activePlan.id}`}>
                <Button size="sm" variant="secondary">
                  <Dumbbell size={14} /> {lang === 'vi' ? 'Buổi tập hôm nay' : "Today's workout"}
                </Button>
              </Link>
            )}
            <Button size="sm" onClick={openPlanModal}>
              <Plus size={14} /> {vx.createPlan}
            </Button>
          </div>
        </div>
        {/* Standalone progress summary only when no active plan carries it inline */}
        {!activePlan && planProgress !== null && (
          <div className="mb-4 rounded-xl border border-border p-4" style={{ background: 'var(--bg-2)' }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text">{vx.clientPlanProgress}</p>
              <p className="text-2xl font-bold text-text">{planProgress}%</p>
            </div>
            <p className="mt-0.5 text-xs text-muted">{vx.noActivePlanInRange}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--ic-blue) 18%, transparent)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, planProgress))}%` }}
                className="h-full rounded-full"
                style={{ background: 'var(--ic-blue)' }}
              />
            </div>
          </div>
        )}
        {plansLoading ? (
          <Spinner size="sm" />
        ) : clientPlans.length === 0 ? (
          <div className="rounded-xl border border-border p-6 text-center" style={{ background: 'var(--bg-2)' }}>
            <ClipboardList size={24} className="mx-auto mb-2 text-muted" />
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
                  className="rounded-xl border p-4 transition-shadow hover:shadow-md"
                  style={{ borderColor: 'var(--ic-blue)', background: 'color-mix(in srgb, var(--ic-blue) 9%, transparent)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="break-words font-semibold text-text">{activePlan.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <CalendarDays size={12} className="shrink-0" />
                        {format(new Date(activePlan.startDate), 'dd/MM/yyyy')} – {format(new Date(activePlan.endDate), 'dd/MM/yyyy')}
                        <span className="text-fg-3">· {activePlan.totalWeeks} {vx.weeks}</span>
                      </p>
                    </div>
                    <span
                      className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                      style={{ background: 'var(--ic-blue)' }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {vx.active}
                    </span>
                  </div>
                  {planProgress !== null && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted">{vx.clientPlanProgress}</span>
                        <span className="font-semibold text-text">{planProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--ic-blue) 18%, transparent)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, Math.min(100, planProgress))}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: planProgress >= 80
                              ? 'var(--ic-green)'
                              : planProgress >= 40
                              ? 'var(--ic-blue)'
                              : 'var(--ic-amber)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </Link>
            )}
            {otherPlans.map((plan) => (
              <Link key={plan.id} to={`/plans/${plan.id}`} state={{ canEdit: true }}>
                <motion.div
                  variants={slideUp}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-shadow hover:shadow-md"
                  style={{ background: 'var(--bg-2)' }}
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium text-text">{plan.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <CalendarDays size={12} className="shrink-0" />
                      {format(new Date(plan.startDate), 'dd/MM/yyyy')} – {format(new Date(plan.endDate), 'dd/MM/yyyy')}
                      <span className="text-fg-3">· {plan.totalWeeks} {vx.weeks}</span>
                    </p>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
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
          <Controller
            name="startDate"
            control={planForm.control}
            render={({ field: startField }) => (
              <Controller
                name="endDate"
                control={planForm.control}
                render={({ field: endField }) => (
                  <DateRangePicker
                    startLabel={vx.startDate}
                    endLabel={vx.endDate}
                    startValue={startField.value}
                    endValue={endField.value}
                    onStartChange={startField.onChange}
                    onEndChange={endField.onChange}
                    startError={planForm.formState.errors.startDate?.message}
                    endError={planForm.formState.errors.endDate?.message}
                  />
                )}
              />
            )}
          />
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
          {isProCoach ? (
            <Button size="sm" onClick={openExerciseModal}>
              <Plus size={14} /> {vx.addExercise}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => navigate('/subscription')}>
              <Lock size={14} /> {vx.addExercise}
            </Button>
          )}
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

      {/* Quick-access tiles */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to={`/coach/clients/${clientId}/nutrition`} className="group">
          <Card hover className="flex h-full items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'color-mix(in srgb, var(--ic-green) 15%, transparent)' }}
            >
              <Utensils size={20} style={{ color: 'var(--ic-green)' }} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-text">{vx.nutrition}</h2>
              <p className="mt-0.5 text-xs text-muted">{vx.nutritionHint}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
          </Card>
        </Link>

        {clientCycle && (
          <Link to={`/coach/clients/${clientId}/cycle`} className="group">
            <Card hover className="flex h-full items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--ic-pink) 15%, transparent)' }}
              >
                <CalendarHeart size={20} style={{ color: 'var(--ic-pink)' }} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-text">{t.cycle.coach.title}</h2>
                <p className="mt-0.5 text-xs text-muted">{t.cycle.coach.hint}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
            </Card>
          </Link>
        )}
      </div>

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
