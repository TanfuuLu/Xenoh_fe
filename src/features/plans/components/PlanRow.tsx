import { motion } from 'framer-motion'
import { ChevronRight, Zap, ZapOff, Trash2, BarChart2, Download, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useExportPlanCsv } from '../index'
import type { PlanResponse } from '../types'

interface PlanRowProps {
  plan: PlanResponse
  onOpen: () => void
  onOverview: () => void
  onActivate: () => void
  onDeactivate: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function PlanRow({ plan, onOpen, onOverview, onActivate, onDeactivate, onDuplicate, onDelete }: PlanRowProps) {
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
            {plan.completedWeeks}/{plan.totalWeeks} {tc.weeks} · {plan.completedDays}/{plan.totalDays} {tc.days}
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
          {plan.totalWeeks > 0 && plan.completedWeeks === plan.totalWeeks && (
            <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate plan" className="text-primary">
              <Copy size={15} />
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
