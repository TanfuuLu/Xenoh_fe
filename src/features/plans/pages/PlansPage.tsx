import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Plus, ChevronRight, Zap, ZapOff, Trash2, BarChart2, Sparkles, Lock, Download } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import { Modal } from '@/shared/components/Modal'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { Select } from '@/shared/components/Select'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useAuthStore } from '@/features/auth'
import { useSubscription } from '@/features/billing/api/useSubscription'
import { useMyClients } from '@/features/coach-client'
import { InlineTip } from '@/features/tips'
import { useLangStore } from '@/shared/i18n'
import {
  usePlans,
  useCreatePlan,
  useCreateAiStarterPlan,
  useActivatePlan,
  useDeactivatePlan,
  useDeletePlan,
  useCoachPlanOverview,
  useCreatePlanForUser,
  useExportPlanCsv,
} from '../index'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'
import type { CoachPlanResponse, PlanResponse } from '../types'

export function PlansPage() {
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const [showCreate, setShowCreate] = useState(false)
  const [showStarterPlan, setShowStarterPlan] = useState(false)
  const [showCreateClientPlan, setShowCreateClientPlan] = useState(false)

  const { data: plans, isLoading } = usePlans()
  const { data: clientPlans, isLoading: clientPlansLoading } = useCoachPlanOverview(isCoach)
  const { data: clients, isLoading: clientsLoading } = useMyClients(isCoach)
  const { mutate: createPlan, isPending: creating, error: createError } = useCreatePlan()
  const { mutate: createStarterPlan, isPending: creatingStarterPlan, error: starterPlanError } = useCreateAiStarterPlan()
  const { mutate: createClientPlan, isPending: creatingClientPlan, error: createClientPlanError } = useCreatePlanForUser()
  const { mutate: activate } = useActivatePlan()
  const { mutate: deactivate } = useDeactivatePlan()
  const { mutate: deletePlan } = useDeletePlan()
  const { confirm, ConfirmDialog } = useConfirm()

  const t = useT()
  const tp = t.plans
  const tcp = t.coachPlans
  const tc = t.common
  const lang = useLangStore((s) => s.lang)

  const activeClients = clients?.filter((c) => c.status === 'Active') ?? []
  const isAdmin = useAuthStore((s) => s.user?.roles?.includes('Admin') ?? false)
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription()
  const hasUnlimitedPlans = isAdmin || (subscription?.isActive === true && subscription?.tier !== 'Free')
  const canCreatePersonalPlan = hasUnlimitedPlans || (plans?.length ?? 0) < 3
  const planLimitLabel = hasUnlimitedPlans ? 'unlimited' : '3'
  const displayedPlans = useMemo(
    () =>
      (plans ?? [])
        .map((plan, index) => ({ plan, index }))
        .sort((a, b) => Number(b.plan.isActive) - Number(a.plan.isActive) || a.index - b.index)
        .map(({ plan }) => plan),
    [plans],
  )

  const coachAssignedPlans = useMemo(
    () => displayedPlans.filter((p) => p.planType === 'Coach'),
    [displayedPlans],
  )
  const selfPlans = useMemo(
    () => displayedPlans.filter((p) => p.planType === 'Self'),
    [displayedPlans],
  )

  const schema = z.object({
    name: z.string().min(2, tp.nameError).max(100),
    startDate: z.string().min(1, tp.requiredError),
    endDate: z.string().min(1, tp.requiredError),
  }).refine((d) => d.endDate > d.startDate, {
    message: tp.endDateError,
    path: ['endDate'],
  })

  const clientPlanSchema = z.object({
    userId: z.string().min(1, tcp.clientRequired),
    name: z.string().min(2, tcp.nameError).max(100),
    startDate: z.string().min(1, tc.required),
    endDate: z.string().min(1, tc.required),
  }).refine((d) => d.endDate > d.startDate, {
    message: tcp.endDateError,
    path: ['endDate'],
  })

  const starterPlanSchema = z.object({
    goal: z.enum(['hypertrophy', 'strength_hypertrophy', 'lean_bulk', 'fat_loss', 'body_recomposition']),
    experience: z.enum(['beginner', 'intermediate', 'advanced']),
    daysPerWeek: z.number().min(2).max(5),
    splitPreference: z.enum(['full_body', 'upper_lower', 'push_pull_legs', 'bro_split']),
    sessionLengthMinutes: z.number().refine((value) => [30, 45, 60, 75, 90].includes(value)),
    equipment: z.enum(['full_gym', 'barbell', 'dumbbells', 'home_gym', 'bodyweight']),
    startDate: z.string().min(1, tp.requiredError),
    endDate: z.string().min(1, tp.requiredError),
    description: z.string().max(500).optional(),
  }).refine((d) => d.endDate > d.startDate, {
    message: tp.endDateError,
    path: ['endDate'],
  })

  type FormData = z.infer<typeof schema>
  type ClientPlanFormData = z.infer<typeof clientPlanSchema>
  type StarterPlanFormData = z.infer<typeof starterPlanSchema>

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const {
    register: registerClientPlan,
    handleSubmit: handleSubmitClientPlan,
    reset: resetClientPlan,
    control: clientPlanControl,
    formState: { errors: clientPlanErrors },
  } = useForm<ClientPlanFormData>({ resolver: zodResolver(clientPlanSchema) })

  const {
    register: registerStarterPlan,
    handleSubmit: handleSubmitStarterPlan,
    reset: resetStarterPlan,
    control: starterPlanControl,
    formState: { errors: starterPlanErrors },
  } = useForm<StarterPlanFormData>({
    resolver: zodResolver(starterPlanSchema),
    defaultValues: {
      goal: 'hypertrophy',
      experience: 'beginner',
      daysPerWeek: 3,
      splitPreference: 'full_body',
      sessionLengthMinutes: 60,
      equipment: 'full_gym',
    },
  })

  function onSubmit(data: FormData) {
    createPlan(data, {
      onSuccess: () => {
        reset()
        setShowCreate(false)
      },
    })
  }

  function onSubmitClientPlan(data: ClientPlanFormData) {
    createClientPlan(data, {
      onSuccess: () => {
        resetClientPlan()
        setShowCreateClientPlan(false)
      },
    })
  }

  function onSubmitStarterPlan(data: StarterPlanFormData) {
    createStarterPlan({ ...data, language: lang }, {
      onSuccess: (plan) => {
        resetStarterPlan()
        setShowStarterPlan(false)
        navigate(`/plans/${plan.id}`)
      },
    })
  }

  async function handleClientPlanDelete(id: string, name: string) {
    if (await confirm(tcp.deleteConfirm.replace('{name}', name), { confirmLabel: t.common.delete, danger: true })) {
      deletePlan(id)
    }
  }

  const apiError = (createError as AxiosError<ApiError>)?.response?.data?.message
  const starterPlanApiError = (starterPlanError as AxiosError<ApiError>)?.response?.data?.message
  const clientPlanApiError = (createClientPlanError as AxiosError<ApiError>)?.response?.data?.message
  const loading = isLoading || subscriptionLoading || (isCoach && (clientPlansLoading || clientsLoading))

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
    {ConfirmDialog}
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-text">Plans</h1>
        <InlineTip placement="plans" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ── My Plans column ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text">My Plans</h2>
              <p className="text-xs text-muted mt-0.5">
                {selfPlans.length}/{planLimitLabel} plan{selfPlans.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-1.5">
              {hasUnlimitedPlans ? (
                <Button onClick={() => setShowStarterPlan(true)} size="sm" variant="secondary" className="gap-1.5">
                  <Sparkles size={14} /> AI starter
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/subscription')}
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 opacity-60"
                  title="Upgrade to Pro to use AI Starter"
                >
                  <Lock size={14} /> AI starter
                </Button>
              )}
              {canCreatePersonalPlan && (
                <Button onClick={() => setShowCreate(true)} size="sm">
                  <Plus size={14} /> {tp.createPlan}
                </Button>
              )}
            </div>
          </div>

          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col gap-3"
          >
            <AnimatePresence>
              {selfPlans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  onOpen={() => navigate(`/plans/${plan.id}`)}
                  onOverview={() => navigate(`/plans/${plan.id}/overview`)}
                  onActivate={() => activate(plan.id)}
                  onDeactivate={() => deactivate(plan.id)}
                  onDelete={async () => {
                    if (await confirm(tp.deleteConfirm, { confirmLabel: t.common.delete, danger: true })) deletePlan(plan.id)
                  }}
                />
              ))}
            </AnimatePresence>

            {selfPlans.length === 0 && (
              <Card className="py-8 text-center text-muted text-sm">
                {tp.empty}
              </Card>
            )}
          </motion.div>
        </section>

        {/* ── Coach Plans column ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text">Coach Plans</h2>
              <p className="text-xs text-muted mt-0.5">{coachAssignedPlans.length} plan{coachAssignedPlans.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col gap-3"
          >
            <AnimatePresence>
              {coachAssignedPlans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  onOpen={() => navigate(`/plans/${plan.id}`)}
                  onOverview={() => navigate(`/plans/${plan.id}/overview`)}
                  onActivate={() => activate(plan.id)}
                  onDeactivate={() => deactivate(plan.id)}
                  onDelete={async () => {
                    if (await confirm(tp.deleteConfirm, { confirmLabel: t.common.delete, danger: true })) deletePlan(plan.id)
                  }}
                />
              ))}
            </AnimatePresence>

            {coachAssignedPlans.length === 0 && (
              <Card className="py-8 text-center text-muted text-sm">
                No coach plans yet.
              </Card>
            )}
          </motion.div>
        </section>
      </div>

      {isCoach && (
        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text">{tcp.title}</h2>
              <p className="mt-1 text-sm text-muted">{clientPlans?.length ?? 0} {tcp.subtitle}</p>
            </div>
            {activeClients.length > 0 && (
              <Button size="sm" className="w-full sm:w-auto" onClick={() => setShowCreateClientPlan(true)}>
                <Plus size={16} /> {tcp.createPlan}
              </Button>
            )}
          </div>

          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
            className="space-y-3"
          >
            {clientPlans?.map((plan) => (
              <ClientPlanRow
                key={plan.id}
                plan={plan}
                onOpen={() => navigate(`/plans/${plan.id}`, { state: { canEdit: true } })}
                onOverview={() => navigate(`/plans/${plan.id}/overview`)}
                onDelete={() => handleClientPlanDelete(plan.id, plan.name)}
              />
            ))}

            {clientPlans?.length === 0 && (
              <Card className="py-10 text-center text-muted">
                {tcp.empty}
              </Card>
            )}
          </motion.div>
        </section>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tp.modalTitle}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={tp.nameLabel}
            placeholder={tp.namePlaceholder}
            error={errors.name?.message}
            {...register('name')}
          />
          <Controller
            name="startDate"
            control={control}
            render={({ field: startField }) => (
              <Controller
                name="endDate"
                control={control}
                render={({ field: endField }) => (
                  <DateRangePicker
                    startLabel={tp.startDateLabel}
                    endLabel={tp.endDateLabel}
                    startValue={startField.value}
                    endValue={endField.value}
                    onStartChange={startField.onChange}
                    onEndChange={endField.onChange}
                    startError={errors.startDate?.message}
                    endError={errors.endDate?.message}
                  />
                )}
              />
            )}
          />
          {apiError && (
            apiError.toLowerCase().includes('limit') || apiError.toLowerCase().includes('upgrade') ? (
              <div
                className="flex flex-col items-center gap-2 rounded-xl p-4 text-center"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--color-primary)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>Plan limit reached</p>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>Upgrade to Pro for unlimited plans.</p>
                <Button size="sm" onClick={() => { setShowCreate(false); navigate('/subscription') }}>
                  View Plans
                </Button>
              </div>
            ) : (
              <p className="text-sm text-danger">{apiError}</p>
            )
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" className="w-full sm:w-auto" onClick={() => setShowCreate(false)}>
              {tc.cancel}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={creating}>
              {tp.create}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showStarterPlan} onClose={() => setShowStarterPlan(false)} title="AI starter plan">
        <form onSubmit={handleSubmitStarterPlan(onSubmitStarterPlan)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="goal"
              control={starterPlanControl}
              render={({ field }) => (
                <Select
                  label="Goal"
                  value={field.value}
                  onChange={field.onChange}
                  error={starterPlanErrors.goal?.message}
                  options={[
                    { value: 'hypertrophy', label: 'Hypertrophy' },
                    { value: 'strength_hypertrophy', label: 'Strength + Hypertrophy' },
                    { value: 'lean_bulk', label: 'Lean Bulk' },
                    { value: 'fat_loss', label: 'Fat loss' },
                    { value: 'body_recomposition', label: 'Body Recomposition' },
                  ]}
                />
              )}
            />
            <Controller
              name="experience"
              control={starterPlanControl}
              render={({ field }) => (
                <Select
                  label="Experience"
                  value={field.value}
                  onChange={field.onChange}
                  error={starterPlanErrors.experience?.message}
                  options={[
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                  ]}
                />
              )}
            />
            <Controller
              name="daysPerWeek"
              control={starterPlanControl}
              render={({ field }) => (
                <Select
                  label="Days per week"
                  value={String(field.value ?? '')}
                  onChange={(value) => field.onChange(Number(value))}
                  error={starterPlanErrors.daysPerWeek?.message}
                  options={[
                    { value: '2', label: '2 days' },
                    { value: '3', label: '3 days' },
                    { value: '4', label: '4 days' },
                    { value: '5', label: '5 days' },
                  ]}
                />
              )}
            />
            <Controller
              name="splitPreference"
              control={starterPlanControl}
              render={({ field }) => (
                <Select
                  label="Training split"
                  value={field.value}
                  onChange={field.onChange}
                  error={starterPlanErrors.splitPreference?.message}
                  options={[
                    { value: 'full_body', label: 'Full body' },
                    { value: 'upper_lower', label: 'Upper / Lower' },
                    { value: 'push_pull_legs', label: 'Push / Pull / Legs' },
                    { value: 'bro_split', label: 'Bro split' },
                  ]}
                />
              )}
            />
            <Controller
              name="sessionLengthMinutes"
              control={starterPlanControl}
              render={({ field }) => (
                <Select
                  label="Session length"
                  value={String(field.value ?? '')}
                  onChange={(value) => field.onChange(Number(value))}
                  error={starterPlanErrors.sessionLengthMinutes?.message}
                  options={[
                    { value: '30', label: '30 minutes' },
                    { value: '45', label: '45 minutes' },
                    { value: '60', label: '60 minutes' },
                    { value: '75', label: '75 minutes' },
                    { value: '90', label: '90 minutes' },
                  ]}
                />
              )}
            />
            <Controller
              name="equipment"
              control={starterPlanControl}
              render={({ field }) => (
                <Select
                  label="Equipment"
                  value={field.value}
                  onChange={field.onChange}
                  error={starterPlanErrors.equipment?.message}
                  options={[
                    { value: 'full_gym', label: 'Full gym' },
                    { value: 'barbell', label: 'Barbell focused' },
                    { value: 'dumbbells', label: 'Dumbbells' },
                    { value: 'home_gym', label: 'Home gym' },
                    { value: 'bodyweight', label: 'Bodyweight' },
                  ]}
                />
              )}
            />
          </div>
          <Controller
            name="startDate"
            control={starterPlanControl}
            render={({ field: startField }) => (
              <Controller
                name="endDate"
                control={starterPlanControl}
                render={({ field: endField }) => (
                  <DateRangePicker
                    startLabel={tp.startDateLabel}
                    endLabel={tp.endDateLabel}
                    startValue={startField.value}
                    endValue={endField.value}
                    onStartChange={startField.onChange}
                    onEndChange={endField.onChange}
                    startError={starterPlanErrors.startDate?.message}
                    endError={starterPlanErrors.endDate?.message}
                  />
                )}
              />
            )}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
              Plan description
            </label>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Optional: injuries to avoid, preferred split, weak points, time limits..."
              className="xn-input min-h-28 resize-none"
              {...registerStarterPlan('description')}
            />
            <div className="flex justify-between gap-2 text-xs text-muted">
              <span>{starterPlanErrors.description?.message}</span>
              <span>Max 500 characters</span>
            </div>
          </div>
          {starterPlanApiError && <p className="text-sm text-danger">{starterPlanApiError}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" className="w-full sm:w-auto" onClick={() => setShowStarterPlan(false)}>
              {tc.cancel}
            </Button>
            <Button type="submit" className="w-full gap-1.5 sm:w-auto" loading={creatingStarterPlan}>
              <Sparkles size={15} /> Create plan
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showCreateClientPlan}
        onClose={() => setShowCreateClientPlan(false)}
        title={tcp.modalTitle}
      >
        <form onSubmit={handleSubmitClientPlan(onSubmitClientPlan)} className="space-y-4">
          <Controller
            name="userId"
            control={clientPlanControl}
            render={({ field }) => (
              <Select
                label={tcp.clientLabel}
                options={activeClients.map((c) => ({ value: c.clientId, label: c.fullName }))}
                placeholder={tcp.clientPlaceholder}
                error={clientPlanErrors.userId?.message}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          <Input
            label={tcp.nameLabel}
            placeholder={tcp.namePlaceholder}
            error={clientPlanErrors.name?.message}
            {...registerClientPlan('name')}
          />
          <Controller
            name="startDate"
            control={clientPlanControl}
            render={({ field: startField }) => (
              <Controller
                name="endDate"
                control={clientPlanControl}
                render={({ field: endField }) => (
                  <DateRangePicker
                    startLabel={tcp.startDateLabel}
                    endLabel={tcp.endDateLabel}
                    startValue={startField.value}
                    endValue={endField.value}
                    onStartChange={startField.onChange}
                    onEndChange={endField.onChange}
                    startError={clientPlanErrors.startDate?.message}
                    endError={clientPlanErrors.endDate?.message}
                  />
                )}
              />
            )}
          />
          {clientPlanApiError && <p className="text-sm text-danger">{clientPlanApiError}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" type="button" className="w-full sm:w-auto" onClick={() => setShowCreateClientPlan(false)}>
              {tc.cancel}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={creatingClientPlan}>
              {tcp.create}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </>
  )
}

interface PlanRowProps {
  plan: PlanResponse
  onOpen: () => void
  onOverview: () => void
  onActivate: () => void
  onDeactivate: () => void
  onDelete: () => void
}

function PlanRow({ plan, onOpen, onOverview, onActivate, onDeactivate, onDelete }: PlanRowProps) {
  const t = useT()
  const tc = t.common
  const { mutate: exportCsv, isPending: exporting } = useExportPlanCsv()

  return (
    <motion.div
      variants={slideUp}
      layout
      exit={{ opacity: 0, height: 0 }}
      onClick={onOpen}
      className="rounded-xl border border-border bg-surface p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-text truncate">{plan.name}</h3>
            {plan.isActive && <Badge variant="success">Active</Badge>}
            {plan.planType === 'Coach' && <Badge variant="primary">Coach</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {format(new Date(plan.startDate), 'dd/MM/yyyy')} - {format(new Date(plan.endDate), 'dd/MM/yyyy')}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {plan.completedDays}/{plan.totalDays} {tc.days} - {plan.totalWeeks} {tc.weeks}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={onOverview} title="Plan overview">
            <BarChart2 size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Export CSV"
            loading={exporting}
            onClick={() => exportCsv(plan.id)}
          >
            {!exporting && <Download size={15} />}
          </Button>
          {plan.isActive ? (
            <Button variant="ghost" size="sm" onClick={onDeactivate}>
              <ZapOff size={15} />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onActivate}>
              <Zap size={15} />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 size={15} className="text-danger" />
          </Button>
          <ChevronRight size={15} style={{ color: 'var(--fg-3)', marginLeft: 2 }} />
        </div>
      </div>
    </motion.div>
  )
}

interface ClientPlanRowProps {
  plan: CoachPlanResponse
  onOpen: () => void
  onOverview: () => void
  onDelete: () => void
}

function ClientPlanRow({ plan, onOpen, onOverview, onDelete }: ClientPlanRowProps) {
  const t = useT()
  const tcp = t.coachPlans
  const { mutate: exportCsv, isPending: exporting } = useExportPlanCsv()

  return (
    <motion.div
      variants={slideUp}
      onClick={onOpen}
      className="group cursor-pointer rounded-xl border border-border bg-surface transition-colors hover:border-primary/40"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate font-semibold text-text transition-colors group-hover:text-primary">
              {plan.name}
            </h3>
            <Badge variant="primary">Coach</Badge>
          </div>
          <p className="text-sm text-muted">
            {tcp.clientRowLabel}: <span className="text-text">{plan.ownerName}</span> ({plan.ownerEmail})
          </p>
          <p className="text-sm text-muted">
            {format(new Date(plan.startDate), 'dd/MM/yyyy')} - {format(new Date(plan.endDate), 'dd/MM/yyyy')}
            &nbsp;-&nbsp;{plan.totalWeeks} {tcp.weeksLabel}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={onOverview} title="Plan overview">
            <BarChart2 size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Export CSV"
            loading={exporting}
            onClick={() => exportCsv(plan.id)}
          >
            {!exporting && <Download size={15} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpen}>
            <ChevronRight size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 size={16} className="text-danger" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
