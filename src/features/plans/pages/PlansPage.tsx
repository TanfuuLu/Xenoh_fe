import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Plus, ChevronRight, Zap, ZapOff, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Modal } from '@/shared/components/Modal'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { Select } from '@/shared/components/Select'
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

  const t = useT()
  const tp = t.plans
  const tcp = t.coachPlans
  const tc = t.common

  const activeClients = clients?.filter((c) => c.status === 'Active') ?? []
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

  function handleClientPlanDelete(id: string, name: string) {
    if (confirm(tcp.deleteConfirm.replace('{name}', name))) {
      deletePlan(id)
    }
  }

  const apiError = (createError as AxiosError<ApiError>)?.response?.data?.message
  const clientPlanApiError = (createClientPlanError as AxiosError<ApiError>)?.response?.data?.message
  const loading = isLoading || (isCoach && (clientPlansLoading || clientsLoading))

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Plans</h1>
          <p className="mt-1 text-sm text-muted">
            {(plans?.length ?? 0)}/3 {isCoach ? 'personal plans' : 'plans'}
            {isCoach && ` - ${clientPlans?.length ?? 0} ${tcp.subtitle}`}
          </p>
        </div>
        {(plans?.length ?? 0) < 3 && (
          <Button onClick={() => setShowCreate(true)} size="sm">
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
                onActivate={() => activate(plan.id)}
                onDeactivate={() => deactivate(plan.id)}
                onDelete={() => {
                  if (confirm(tp.deleteConfirm)) deletePlan(plan.id)
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text">{tcp.title}</h2>
              <p className="mt-1 text-sm text-muted">{clientPlans?.length ?? 0} {tcp.subtitle}</p>
            </div>
            {activeClients.length > 0 && (
              <Button size="sm" onClick={() => setShowCreateClientPlan(true)}>
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
          <Input
            label={tp.startDateLabel}
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label={tp.endDateLabel}
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
          {apiError && <p className="text-sm text-danger">{apiError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              {tc.cancel}
            </Button>
            <Button type="submit" loading={creating}>
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
          <Input
            label={tcp.startDateLabel}
            type="date"
            error={clientPlanErrors.startDate?.message}
            {...registerClientPlan('startDate')}
          />
          <Input
            label={tcp.endDateLabel}
            type="date"
            error={clientPlanErrors.endDate?.message}
            {...registerClientPlan('endDate')}
          />
          {clientPlanApiError && <p className="text-sm text-danger">{clientPlanApiError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowCreateClientPlan(false)}>
              {tc.cancel}
            </Button>
            <Button type="submit" loading={creatingClientPlan}>
              {tcp.create}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

interface PlanRowProps {
  plan: PlanResponse
  onOpen: () => void
  onActivate: () => void
  onDeactivate: () => void
  onDelete: () => void
}

function PlanRow({ plan, onOpen, onActivate, onDeactivate, onDelete }: PlanRowProps) {
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
      <div className="flex items-start justify-between gap-3">
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

        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
  onDelete: () => void
}

function ClientPlanRow({ plan, onOpen, onDelete }: ClientPlanRowProps) {
  const t = useT()
  const tcp = t.coachPlans

  return (
    <motion.div
      variants={slideUp}
      onClick={onOpen}
      className="group cursor-pointer rounded-xl border border-border bg-surface transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text group-hover:text-primary transition-colors">
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

        <div className="flex flex-shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
