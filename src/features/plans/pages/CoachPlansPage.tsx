import { useState } from 'react'
import { Link } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Modal } from '@/shared/components/Modal'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useConfirm } from '@/shared/components/ConfirmModal'
import { useCoachPlanOverview, useCreatePlanForUser, useDeletePlan } from '../index'
import { useMyClients } from '@/features/coach-client'
import { InlineTip } from '@/features/tips'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

export function CoachPlansPage() {
  const shouldReduce = useReducedMotion()
  const [showCreate, setShowCreate] = useState(false)
  const { data: plans, isLoading } = useCoachPlanOverview()
  const { data: clients } = useMyClients()
  const { mutate: createPlan, isPending: creating, error } = useCreatePlanForUser()
  const { mutate: deletePlan } = useDeletePlan()
  const { confirm, ConfirmDialog } = useConfirm()
  const t   = useT()
  const tcp = t.coachPlans
  const tc  = t.common

  const activeClients = clients?.filter((c) => c.status === 'Active') ?? []

  // Schema inside component for translated error messages
  const schema = z.object({
    userId: z.string().min(1, tcp.clientRequired),
    name: z.string().min(2, tcp.nameError).max(100),
    startDate: z.string().min(1, tc.required),
    endDate: z.string().min(1, tc.required),
  }).refine((d) => d.endDate > d.startDate, { message: tcp.endDateError, path: ['endDate'] })

  type FormData = z.infer<typeof schema>

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormData) {
    createPlan(data, { onSuccess: () => { reset(); setShowCreate(false) } })
  }

  async function handleDelete(id: string, name: string) {
    if (await confirm(tcp.deleteConfirm.replace('{name}', name), { confirmLabel: tc.delete, danger: true })) {
      deletePlan(id)
    }
  }

  const apiError = (error as AxiosError<ApiError>)?.response?.data?.message

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
    {ConfirmDialog}
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{tcp.title}</h1>
          <p className="mt-1 text-sm text-muted">{plans?.length ?? 0} {tcp.subtitle}</p>
        </div>
        {activeClients.length > 0 && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> {tcp.createPlan}
          </Button>
        )}
      </div>

      <InlineTip placement="coach-plans" audience="coach" />

      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="space-y-3"
      >
        {plans?.map((plan) => (
          <motion.div
            key={plan.id}
            variants={slideUp}
            className="group rounded-xl border border-white/8 bg-surface transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3 p-4">
              {/* Clickable plan info → PlanDetailPage with canEdit: true */}
              <Link
                to={`/plans/${plan.id}`}
                state={{ canEdit: true }}
                className="min-w-0 flex-1"
              >
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
                  {format(new Date(plan.startDate), 'dd/MM/yyyy')} → {format(new Date(plan.endDate), 'dd/MM/yyyy')}
                  &nbsp;·&nbsp;{plan.totalWeeks} {tcp.weeksLabel}
                </p>
              </Link>

              {/* Actions */}
              <div className="flex flex-shrink-0 items-center gap-1">
                <Link
                  to={`/plans/${plan.id}`}
                  state={{ canEdit: true }}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-white/6 hover:text-text"
                >
                  <ChevronRight size={18} />
                </Link>
                <button
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {plans?.length === 0 && (
          <Card className="py-10 text-center text-muted">
            {tcp.empty}
          </Card>
        )}
      </motion.div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={tcp.modalTitle}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="userId"
            control={control}
            render={({ field }) => (
              <Select
                label={tcp.clientLabel}
                options={activeClients.map((c) => ({ value: c.clientId, label: c.fullName }))}
                placeholder={tcp.clientPlaceholder}
                error={errors.userId?.message}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          <Input label={tcp.nameLabel} placeholder={tcp.namePlaceholder} error={errors.name?.message} {...register('name')} />
          <Input label={tcp.startDateLabel} type="date" error={errors.startDate?.message} {...register('startDate')} />
          <Input label={tcp.endDateLabel} type="date" error={errors.endDate?.message} {...register('endDate')} />
          {apiError && <p className="text-sm text-danger">{apiError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>{tc.cancel}</Button>
            <Button type="submit" loading={creating}>{tcp.create}</Button>
          </div>
        </form>
      </Modal>
    </div>
    </>
  )
}
