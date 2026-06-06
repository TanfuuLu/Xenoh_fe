import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, isValid } from 'date-fns'
import { Spinner } from '@/shared/components/Spinner'
import { slideUp } from '@/shared/utils/motion'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { useExercisePrHistory, useExercisePrs } from '../index'
import { SharePrButton } from './SharePrButton'
import { useAuthStore } from '@/features/auth'

interface Props {
  exerciseTemplateId: string
  exerciseName: string
}

function formatDate(value: string | null | undefined, pattern = 'dd/MM/yyyy') {
  if (!value) return '-'
  const date = new Date(value)
  return isValid(date) ? format(date, pattern) : '-'
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="truncate font-medium text-text">{value}</p>
    </div>
  )
}

export function ExercisePrPanel({ exerciseTemplateId, exerciseName }: Props) {
  const { data: prs, isLoading: loadingPrs } = useExercisePrs()
  const { data: history, isLoading: loadingHistory } = useExercisePrHistory(exerciseTemplateId)
  const userId = useAuthStore((s) => s.user?.id)

  const selectedPr = useMemo(
    () => (prs ?? []).find((pr) => pr.exerciseTemplateId === exerciseTemplateId),
    [prs, exerciseTemplateId],
  )

  const chartData = useMemo(() => {
    const points = [...(history ?? [])].sort(
      (a, b) => new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime(),
    )

    return points.map((point, index) => {
      const previous = points[index - 1]
      const gain = previous ? Math.max(0, point.weight - previous.weight) : point.weight
      const isBaseline = index === 0

      return {
        date: formatDate(point.achievedAt, 'dd/MM'),
        fullDate: formatDate(point.achievedAt),
        label: isBaseline ? 'Baseline' : `PR ${index + 1}`,
        weight: point.weight,
        previousWeight: previous?.weight ?? null,
        reps: point.reps,
        gain,
        gainLabel: isBaseline ? `${point.weight} kg start` : `+${gain} kg`,
      }
    })
  }, [history])

  const improvementData = useMemo(() => {
    if (chartData.length <= 1) return chartData
    return chartData.slice(1)
  }, [chartData])

  const totalGain = chartData.length >= 2
    ? Math.max(0, chartData[chartData.length - 1].weight - chartData[0].weight)
    : null
  const bestJump = improvementData.length > 0
    ? Math.max(...improvementData.map((point) => point.gain))
    : null

  return (
    <RequireTier feature="Exercise Tracking & Personal Records">
      <div className="space-y-4">
        {loadingPrs ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        ) : selectedPr ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid grid-cols-3 gap-3">
                <SummaryStat label="Current PR" value={`${selectedPr.currentWeight} kg`} />
                <SummaryStat label="Reps" value={`× ${selectedPr.reps}`} />
                <SummaryStat label="Achieved" value={formatDate(selectedPr.achievedAt)} />
              </div>
              {userId && (
                <SharePrButton
                  userId={userId}
                  exerciseTemplateId={exerciseTemplateId}
                  exerciseName={exerciseName}
                />
              )}
            </div>

            {loadingHistory ? (
              <div className="flex h-48 items-center justify-center">
                <Spinner />
              </div>
            ) : chartData.length > 0 ? (
              <motion.div initial="hidden" animate="visible" variants={slideUp} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">PR jumps</p>
                    <p className="text-sm text-muted">
                      {chartData.length === 1
                        ? 'First recorded PR for this lift.'
                        : 'Each bar shows the kg added since the previous PR.'}
                    </p>
                  </div>
                  {totalGain !== null && (
                    <div className="flex gap-4 text-right">
                      <SummaryStat label="Total gain" value={`+${totalGain} kg`} />
                      <SummaryStat label="Best jump" value={`+${bestJump ?? 0} kg`} />
                    </div>
                  )}
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={improvementData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 11 }} />
                      <YAxis
                        tick={{ fill: 'var(--fg-3)', fontSize: 11 }}
                        tickFormatter={(value) => `+${value}`}
                        width={44}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'color-mix(in srgb, var(--xn-clay-500) 10%, transparent)' }}
                        formatter={(value, name, item) => [
                          item.payload.previousWeight === null
                            ? `${item.payload.weight} kg baseline (${item.payload.reps} reps)`
                            : `+${value} kg to ${item.payload.weight} kg (${item.payload.reps} reps)`,
                          name,
                        ]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                        contentStyle={{
                          background: 'var(--bg-2)',
                          border: '1px solid var(--border-1)',
                          borderRadius: 8,
                        }}
                        labelStyle={{ color: 'var(--fg-1)' }}
                        itemStyle={{ color: 'var(--xn-clay-700)' }}
                      />
                      <Bar dataKey="gain" name="PR jump" radius={[6, 6, 0, 0]} maxBarSize={56}>
                        {improvementData.map((point, index) => (
                          <Cell
                            key={`${point.fullDate}-${index}`}
                            fill={
                              point.previousWeight === null
                                ? 'var(--xn-clay-500)'
                                : 'var(--xn-clay-700)'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {chartData.slice(-4).map((point) => (
                    <div
                      key={`${point.fullDate}-${point.weight}-${point.reps}`}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                      style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text">{point.weight} kg x {point.reps}</p>
                        <p className="text-xs text-muted">{point.fullDate}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[var(--xn-clay-700)]">
                        {point.gainLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <p className="text-sm text-muted">No PR history found for this exercise.</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'var(--bg-3)', color: 'var(--xn-clay-700)' }}
            >
              <Trophy size={22} />
            </div>
            <h3 className="font-semibold text-text">No PR yet</h3>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Log a set for {exerciseName} to see your personal record progress here.
            </p>
          </div>
        )}
      </div>
    </RequireTier>
  )
}
