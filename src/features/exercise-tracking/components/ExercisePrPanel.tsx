import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
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

  const chartData = useMemo(
    () =>
      (history ?? []).map((point) => ({
        date: formatDate(point.achievedAt, 'dd/MM'),
        fullDate: formatDate(point.achievedAt),
        weight: point.weight,
        reps: point.reps,
      })),
    [history],
  )

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
              <motion.div initial="hidden" animate="visible" variants={slideUp} className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: 'var(--fg-3)', fontSize: 11 }}
                      domain={['auto', 'auto']}
                      width={44}
                    />
                    <Tooltip
                      formatter={(value, name, item) => [
                        `${value} kg (${item.payload.reps} reps)`,
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
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight"
                      stroke="var(--xn-clay-700)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--xn-clay-700)', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
