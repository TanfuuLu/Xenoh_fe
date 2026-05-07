import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Plus, ChevronRight, Zap, ZapOff, Trash2, BarChart2 } from 'lucide-react'
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
import { useMyClients } from '@/features/coach-client'
import {
  usePlans,
  useCreatePlan,
  useActivatePlan,
  useDeactivatePlan,
  useDeletePlan,
  useCoachPlanOverview,
  useCreatePlanForUser,
} from '../index'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'
import type { CoachPlanResponse, PlanResponse } from '../types'

export function PlansPage() {
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const [showCreate, setShowCreate] = useState(false)
  const [showCreateClientPlan, setShowCreateClientPlan] = useState(false)

  const { data: plans, isLoading } = usePlans()
  const { data: clientPlans, isLoading: clientPlansLoading } = useCoachPlanOverview(isCoach)
  const { data: clients, isLoading: clientsLoading } = useMyClients(isCoach)
  const { mutate: createPlan, isPending: creating, error: createError } = useCreatePlan()
  const { mutate: createClientPlan, isPending: creatingClientPlan, error: createClientPlanError } = useCreatePlanForUser()
  const { mutate: activate } = useActivatePlan()
  const { mutate: deactivate } = useDeactivatePlan()
  const { mutate: deletePlan } = useDeletePlan()
  const { confirm, ConfirmDialog } = useConfirm()

  const t = useT()
  const tp = t.plans
  const tcp = t.coachPlans
  const tc = t.common

  const activeClients = clients?.filter((c) => c.status === 'Active') ?? []
  // TEMP TEST BYPASS: every user can create unlimited personal plans while testing.
  const subscriptionLoading = false
  const hasUnlimitedPlans = true
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

  type FormData = z.infer<typeof schema>
  type ClientPlanFormData = z.infer<typeof clientPlanSchema>

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

  async function handleClientPlanDelete(id: string, name: string) {
    if (await confirm(tcp.deleteConfirm.replace('{name}', name), { confirmLabel: t.common.delete, danger: true })) {
      deletePlan(id)
    }
  }

  const apiError = (createError as AxiosError<ApiError>)?.response?.data?.message
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text">Plans</h1>
          <p className="mt-1 text-sm text-muted">
            {(plans?.length ?? 0)}/{planLimitLabel} {isCoach ? 'personal plans' : 'plans'}
            {isCoach && ` - ${clientPlans?.length ?? 0} ${tcp.subtitle}`}
          </p>
        </div>
        {canCreatePersonalPlan && (
          <Button onClick={() => setShowCreate(true)} size="sm" className="w-full sm:w-auto">
            <Plus size={16} /> {tp.createPlan}
          </Button>
        )}
      </div>

      <section className="space-y-3">
        <motion.div
          initial={shouldReduce ? false : 'hidden'}
          animate="visible"
          variants={staggerContainer}
          className="space-y-3"
        >
          <AnimatePresence>
            {displayedPlans.map((plan) => (
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

          {plans?.length === 0 && (
            <Card className="py-10 text-center text-muted">
              {tp.empty}
            </Card>
          )}
        </motion.div>
      </section>

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
