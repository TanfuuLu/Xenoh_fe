import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { usePlans, useCreatePlan, useActivatePlan, useDeactivatePlan, useDeletePlan } from '../index'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

export function PlansPage() {
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const { data: plans, isLoading } = usePlans()
  const { mutate: createPlan, isPending: creating, error: createError } = useCreatePlan()
  const { mutate: activate } = useActivatePlan()
  const { mutate: deactivate } = useDeactivatePlan()
  const { mutate: deletePlan } = useDeletePlan()
  const t  = useT()
  const tp = t.plans
  const tc = t.common

  // Build zod schema with translated messages
  const schema = z.object({
    name: z.string().min(2, tp.nameError).max(100),
    startDate: z.string().min(1, tp.requiredError),
    endDate: z.string().min(1, tp.requiredError),
  }).refine((d) => d.endDate > d.startDate, {
    message: tp.endDateError,
    path: ['endDate'],
  })

  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function onSubmit(data: FormData) {
    createPlan(data, {
      onSuccess: () => { reset(); setShowCreate(false) },
    })
  }

  const apiError = (createError as AxiosError<ApiError>)?.response?.data?.message

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{tp.title}</h1>
          <p className="mt-1 text-sm text-muted">{plans?.length ?? 0}/3 plans</p>
        </div>
        {(plans?.length ?? 0) < 3 && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus size={16} /> {tp.createPlan}
          </Button>
        )}
      </div>

      {/* Plan list */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="space-y-3"
      >
        <AnimatePresence>
          {plans?.map((plan) => (
            <motion.div
              key={plan.id}
              variants={slideUp}
              layout
              exit={{ opacity: 0, height: 0 }}
              // ── Whole row is clickable ──────────────────────────────────
              onClick={() => navigate(`/plans/${plan.id}`)}
              className="rounded-xl border border-border bg-surface p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text truncate">{plan.name}</h3>
                    {plan.isActive && <Badge variant="success">Active</Badge>}
                    {plan.planType === 'Coach' && <Badge variant="primary">Coach</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {format(new Date(plan.startDate), 'dd/MM/yyyy')} → {format(new Date(plan.endDate), 'dd/MM/yyyy')}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {plan.completedDays}/{plan.totalDays} {tc.days} · {plan.totalWeeks} {tc.weeks}
                  </p>
                </div>

                {/* Actions — stopPropagation so they don't trigger row navigation */}
                <div
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {plan.isActive ? (
                    <Button variant="ghost" size="sm" onClick={() => deactivate(plan.id)}>
                      <ZapOff size={15} />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => activate(plan.id)}>
                      <Zap size={15} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (confirm(tp.deleteConfirm)) deletePlan(plan.id) }}
                  >
                    <Trash2 size={15} className="text-danger" />
                  </Button>
                  <ChevronRight size={15} style={{ color: 'var(--fg-3)', marginLeft: 2 }} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {plans?.length === 0 && (
          <Card className="py-10 text-center text-muted">
            {tp.empty}
          </Card>
        )}
      </motion.div>

      {/* Create plan modal */}
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
    </div>
  )
}
