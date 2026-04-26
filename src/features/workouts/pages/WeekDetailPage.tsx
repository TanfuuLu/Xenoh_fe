import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2, Copy, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { staggerContainer, slideUp, scaleIn } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { useDailyWorkouts, useCopyDay } from '../index'
import type { DailyWorkoutResponse } from '../types'

export function WeekDetailPage() {
  const { planId = '', weekId = '' } = useParams()
  const { state } = useLocation()
  const canEdit = (state as { canEdit?: boolean } | null)?.canEdit ?? true
  const shouldReduce = useReducedMotion()

  const { data: days, isLoading } = useDailyWorkouts(weekId)
  const { mutate: copyDay, isPending: copying } = useCopyDay(weekId)

  const t  = useT()
  const tw = t.weekDetail
  const tc = t.common
  const lang = useLangStore((s) => s.lang)
  const dateLocale = lang === 'vi' ? viLocale : enUS

  const [copySource, setCopySource] = useState<DailyWorkoutResponse | null>(null)
  const [copyTarget, setCopyTarget] = useState('')

  function handleCopy() {
    if (!copySource || !copyTarget) return
    copyDay(
      { sourceDailyWorkoutId: copySource.id, data: { targetDailyWorkoutId: copyTarget } },
      { onSuccess: () => { setCopySource(null); setCopyTarget('') } },
    )
  }

  function openCopy(day: DailyWorkoutResponse, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCopySource(day)
    setCopyTarget('')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const targetOptions = days
    ?.filter((d) => d.id !== copySource?.id)
    .map((d) => ({
      value: d.id,
      label: `${d.dayOfWeek} · ${format(new Date(d.date), 'd MMM', { locale: dateLocale })}`,
    })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to={`/plans/${planId}`}>
          <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-text">{tw.title}</h1>
      </div>

      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {days?.map((day) => (
          <motion.div key={day.id} variants={slideUp} className="group relative">
            <Link
              to={`/days/${day.id}`}
              state={{ canEdit }}
              className={cn(
                'flex flex-col rounded-xl border p-4 transition-all cursor-pointer',
                'hover:-translate-y-0.5 hover:shadow-md',
              )}
              style={
                day.isCompleted
                  ? { borderColor: 'var(--xn-sage-400)', background: 'var(--xn-sage-200)' }
                  : { borderColor: 'var(--border-1)', background: 'var(--bg-2)' }
              }
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                    {day.dayOfWeek}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>
                    {format(new Date(day.date), 'd MMM', { locale: dateLocale })}
                  </p>
                </div>
                {day.isCompleted ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--xn-success)' }} />
                ) : (
                  <Badge variant={day.totalExercises === 0 ? 'default' : 'warning'}>
                    {day.completedExercises}/{day.totalExercises}
                  </Badge>
                )}
              </div>

              <p className="mt-2 text-xs" style={{ color: 'var(--fg-3)' }}>
                {day.totalExercises} {tc.exercises}
              </p>

              {/* CTA */}
              <div
                className="mt-3 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                style={
                  day.isCompleted
                    ? { background: 'rgba(139,150,101,0.15)', color: 'var(--xn-success)' }
                    : { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' }
                }
              >
                {day.isCompleted ? (
                  <><CheckCircle2 size={13} /> {tw.completed}</>
                ) : (
                  <>{tw.startSession} <ChevronRight size={13} /></>
                )}
              </div>
            </Link>

            {/* Copy button — overlaid top-right, only when canEdit */}
            {canEdit && (
              <button
                onClick={(e) => openCopy(day, e)}
                title={tw.copyDay}
                className="absolute right-2 top-2 rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                style={{ color: 'var(--fg-3)', background: 'var(--bg-3)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-1)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-3)' }}
              >
                <Copy size={13} />
              </button>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Copy Day Modal */}
      <AnimatePresence>
        {copySource && (
          <Modal
            open={!!copySource}
            onClose={() => { setCopySource(null); setCopyTarget('') }}
            title={tw.copyDayTitle}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={scaleIn}
              className="space-y-4"
            >
              {/* Source info */}
              <div
                className="rounded-lg px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg-3)', borderLeft: '3px solid var(--xn-clay-500)' }}
              >
                <p className="text-xs font-medium text-muted mb-0.5">{tw.copyDayFrom}</p>
                <p className="font-medium text-text">
                  {copySource.dayOfWeek} · {format(new Date(copySource.date), 'd MMM', { locale: dateLocale })}
                  <span className="ml-2 text-xs text-muted">({copySource.totalExercises} {tc.exercises})</span>
                </p>
              </div>

              {/* Target select */}
              <Select
                label={tw.copyDayTarget}
                options={targetOptions}
                placeholder={tw.copyDayTargetPlaceholder}
                value={copyTarget}
                onChange={setCopyTarget}
              />

              {/* Warning */}
              {copyTarget && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
                  style={{ background: 'var(--xn-warning-bg, rgba(245,158,11,0.1))', color: 'var(--xn-warning, #f59e0b)' }}
                >
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{tw.copyDayWarning}</span>
                </motion.div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => { setCopySource(null); setCopyTarget('') }}
                >
                  {tc.cancel}
                </Button>
                <Button
                  type="button"
                  disabled={!copyTarget}
                  loading={copying}
                  onClick={handleCopy}
                >
                  <Copy size={14} /> {tw.copyDayConfirm}
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
