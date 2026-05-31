import { format, subDays } from 'date-fns'
import { Flame, LineChart as LineChartIcon, Scale, Sparkles, TrendingUp, Utensils } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useT } from '@/shared/i18n'
import { useNutritionHistory } from '../api/useNutrition'
import { NutritionHistoryCards } from './NutritionHistoryCards'
import type { NutritionSummaryResponse } from '../types'
import { buildNutritionInsight, type LogForm } from './nutritionHelpers'

export function NutritionHistoryPanel({
  clientId,
  enabled,
  calorieTarget,
}: {
  clientId?: string
  enabled: boolean
  calorieTarget: number | null
}) {
  const t = useT()
  const tn = t.nutrition
  const to = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const { data = [], isLoading } = useNutritionHistory(from, to, enabled, clientId)
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'dd/MM'),
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    target: calorieTarget ?? undefined,
  }))
  const average = data.length
    ? Math.round(data.reduce((sum, item) => sum + item.calories, 0) / data.length)
    : null
  const macroAverage = data.length
    ? {
        proteinG: Math.round(data.reduce((sum, item) => sum + item.proteinG, 0) / data.length),
        carbsG: Math.round(data.reduce((sum, item) => sum + item.carbsG, 0) / data.length),
        fatG: Math.round(data.reduce((sum, item) => sum + item.fatG, 0) / data.length),
      }
    : null

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LineChartIcon size={17} className="text-primary" />
          <h2 className="text-lg font-semibold text-text">{tn.advancedTitle}</h2>
        </div>
        <p className="text-sm text-muted">
          {average ? tn.advancedAvg.replace('{n}', String(average)) : tn.advancedNoLogs}
        </p>
      </div>
      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted">{tn.advancedEmpty}</p>
      ) : (
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--fg-3)', fontSize: 12 }} width={48} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}
                  formatter={(value, name) => [
                    `${value} ${name === 'calories' || name === 'target' ? tn.kcal : 'g'}`,
                    name === 'proteinG'
                      ? tn.proteinShort
                      : name === 'carbsG'
                        ? tn.carbsShort
                        : name === 'fatG'
                          ? tn.fatShort
                          : name === 'target'
                            ? tn.targetLabel
                            : tn.caloriesShort,
                  ]}
                />
                <Line type="monotone" dataKey="calories" stroke="var(--xn-clay-800)" strokeWidth={2} dot={false} />
                {calorieTarget && (
                  <Line type="monotone" dataKey="target" stroke="var(--xn-warning)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--fg-3)', fontSize: 12 }} width={40} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}
                    cursor={{ stroke: 'var(--fg-3)', strokeDasharray: '4 4' }}
                    formatter={(value, name) => [
                      `${value} g`,
                      name === 'proteinG' ? tn.proteinShort : name === 'carbsG' ? tn.carbsShort : tn.fatShort,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="proteinG"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="carbsG"
                    stroke="var(--xn-success)"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fatG"
                    stroke="var(--xn-warning)"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {macroAverage && (
              <div className="grid gap-2 self-start">
                <AverageMacroPill label={tn.proteinShort} value={macroAverage.proteinG} color="var(--color-primary)" />
                <AverageMacroPill label={tn.carbsShort} value={macroAverage.carbsG} color="var(--xn-success)" />
                <AverageMacroPill label={tn.fatShort} value={macroAverage.fatG} color="var(--xn-warning)" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-3 flex items-center gap-2">
          <Utensils size={17} className="text-primary" />
          <h3 className="text-base font-semibold text-text">{tn.historyCardsTitle}</h3>
        </div>
        <NutritionHistoryCards
          from={from}
          to={to}
          enabled={enabled}
          clientId={clientId}
          calorieTarget={calorieTarget}
        />
      </div>
    </Card>
  )
}

export function NutritionInsightPanel({
  clientId,
  enabled,
  summary,
  logForm,
}: {
  clientId?: string
  enabled: boolean
  summary: NutritionSummaryResponse
  logForm: LogForm
}) {
  const t = useT()
  const tn = t.nutrition
  const to = format(new Date(), 'yyyy-MM-dd')
  const from = format(subDays(new Date(), 13), 'yyyy-MM-dd')
  const { data = [], isLoading } = useNutritionHistory(from, to, enabled, clientId)
  const insight = buildNutritionInsight(summary, logForm, data, tn)

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles size={17} className="text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-text">{tn.nutritionInsightTitle}</h2>
            <p className="text-sm text-muted">{tn.nutritionInsightSubtitle}</p>
          </div>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
          {tn.last14Days}
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Spinner /></div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <InsightMetric icon={<Scale size={17} />} label={tn.weightGap} value={insight.weightGap} detail={insight.weightNote} />
            <InsightMetric icon={<Flame size={17} />} label={tn.calorieConsistency} value={insight.calorieConsistency} detail={insight.calorieNote} />
            <InsightMetric icon={<Utensils size={17} />} label={tn.macroBalance} value={insight.macroBalance} detail={insight.macroNote} />
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={17} className="text-primary" />
              <h3 className="font-semibold text-text">{tn.nutritionNextMove}</h3>
            </div>
            <div className="space-y-3">
              {insight.actions.map((action) => (
                <div key={action.title} className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-3)' }}>
                  <p className="font-semibold text-text">{action.title}</p>
                  <p className="mt-1 text-sm text-muted">{action.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function InsightMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-text">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </div>
  )
}

function AverageMacroPill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-3)', border: '1px solid var(--border-1)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          <span className="text-sm font-medium text-text">{label}</span>
        </div>
        <span className="text-sm font-semibold text-text">{value}g</span>
      </div>
    </div>
  )
}
