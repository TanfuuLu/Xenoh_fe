import { motion } from 'framer-motion'
import { ChevronRight, Trash2, BarChart2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useExportPlanCsv } from '../index'
import type { CoachPlanResponse } from '../types'

interface ClientPlanRowProps {
  plan: CoachPlanResponse
  onOpen: () => void
  onOverview: () => void
  onDelete: () => void
}

export function ClientPlanRow({ plan, onOpen, onOverview, onDelete }: ClientPlanRowProps) {
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
