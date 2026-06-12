import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { Check, Flame, LineChart as LineChartIcon, Scale, Sparkles, TrendingUp, Utensils } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useT } from '@/shared/i18n'
import { useNutritionHistory, useUpdateNutritionProfile } from '../api/useNutrition'
import { NutritionHistoryCards } from './NutritionHistoryCards'
import type { NutritionSummaryResponse } from '../types'
import {
  buildNutritionInsight,
  isStrategyActive,
  MACRO_COLORS,
  strategyToProfileMacros,
  type LogForm,
  type MacroStrategy,
} from './nutritionHelpers'

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
  const loggedDays = data.length
  const calorieValues = chartData.flatMap((item) =>
    calorieTarget ? [item.calories, calorieTarget] : [item.calories],
  )
  const calorieLow = calorieValues.length ? Math.min(...calorieValues) : 0
  const calorieHigh = calorieValues.length ? Math.max(...calorieValues) : 0
  const caloriePadding = Math.max(120, Math.round((calorieHigh - calorieLow) * 0.2))
  const calorieDomain = [
    Math.max(0, calorieLow - caloriePadding),
    calorieHigh + caloriePadding,
  ] as [number, number]
  const calorieDelta = average != null && calorieTarget
    ? average - calorieTarget
    : null
  const latestCalories = data.length ? data[data.length - 1].calories : null
  const caloriePeak = data.length ? Math.max(...data.map((item) => item.calories)) : null
  const calorieLowDay = data.length ? Math.min(...data.map((item) => item.calories)) : null
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
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg-3) 54%, var(--bg-2)), var(--bg-2))', border: '1px solid var(--border-1)' }}>
            <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <AnalysisStat label={tn.advancedAvg.replace('{n}', '').trim() || tn.caloriesShort} value={average ? `${average.toLocaleString()} ${tn.kcal}` : tn.missing} />
              <AnalysisStat label={tn.targetLabel} value={calorieTarget ? `${calorieTarget.toLocaleString()} ${tn.kcal}` : tn.missing} />
              <AnalysisStat
                label="vs target"
                value={calorieDelta == null ? tn.missing : `${calorieDelta > 0 ? '+' : ''}${calorieDelta.toLocaleString()} ${tn.kcal}`}
                tone={calorieDelta == null ? 'neutral' : Math.abs(calorieDelta) <= 150 ? 'good' : 'warn'}
              />
              <AnalysisStat label="range" value={calorieLowDay != null && caloriePeak != null ? `${calorieLowDay.toLocaleString()}-${caloriePeak.toLocaleString()}` : tn.missing} />
            </div>

            <div className="h-[19rem]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 18, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="calorieLineGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                    <stop offset="52%" stopColor="var(--xn-warning)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke="color-mix(in srgb, var(--border-1) 72%, transparent)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--fg-3)', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-1)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'var(--fg-3)', fontSize: 12, fontWeight: 600 }}
                  width={58}
                  domain={calorieDomain}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-1)' }}
                  tickFormatter={(value: number) => `${Math.round(value / 100) / 10}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border-1)',
                    borderRadius: 10,
                    boxShadow: '0 16px 38px color-mix(in srgb, var(--fg-1) 16%, transparent)',
                  }}
                  cursor={{ stroke: 'var(--fg-3)', strokeDasharray: '4 4' }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()} ${name === 'calories' || name === 'target' ? tn.kcal : 'g'}`,
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
                {average && (
                  <ReferenceLine
                    y={average}
                    stroke="var(--fg-2)"
                    strokeDasharray="2 5"
                    strokeOpacity={0.7}
                    label={{ value: `${average.toLocaleString()} avg`, position: 'insideTopRight', fill: 'var(--fg-2)', fontSize: 12 }}
                  />
                )}
                {calorieTarget && (
                  <ReferenceLine
                    y={calorieTarget}
                    stroke="var(--xn-warning)"
                    strokeDasharray="7 6"
                    strokeWidth={2}
                    label={{ value: `${calorieTarget.toLocaleString()} target`, position: 'insideTopLeft', fill: 'var(--xn-warning)', fontSize: 12 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="url(#calorieLineGlow)"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2, stroke: 'var(--bg-1)', fill: 'var(--xn-warning)' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--bg-1)', fill: 'var(--xn-warning)' }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>{loggedDays} logged days</span>
              {latestCalories != null && <span>Latest {latestCalories.toLocaleString()} {tn.kcal}</span>}
            </div>
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
                    stroke={MACRO_COLORS.protein}
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="carbsG"
                    stroke={MACRO_COLORS.carbs}
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fatG"
                    stroke={MACRO_COLORS.fat}
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-1)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {macroAverage && (
              <div className="grid gap-2 self-start">
                <AverageMacroPill label={tn.proteinShort} value={macroAverage.proteinG} color={MACRO_COLORS.protein} />
                <AverageMacroPill label={tn.carbsShort} value={macroAverage.carbsG} color={MACRO_COLORS.carbs} />
                <AverageMacroPill label={tn.fatShort} value={macroAverage.fatG} color={MACRO_COLORS.fat} />
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

  const { mutate: applyProfile, isPending: applyingStrategy } = useUpdateNutritionProfile(clientId)
  const [pendingStrategy, setPendingStrategy] = useState<string | null>(null)
  const calc = summary.calculation
  const canSelectStrategy =
    calc.bodyweightKg != null && calc.bodyweightKg > 0 && calc.calorieTarget != null && calc.calorieTarget > 0

  function handleSelectStrategy(strategy: MacroStrategy) {
    if (!canSelectStrategy || calc.bodyweightKg == null || calc.calorieTarget == null) return
    const macros = strategyToProfileMacros(strategy, calc.calorieTarget, calc.bodyweightKg)
    setPendingStrategy(strategy.title)
    applyProfile(
      {
        activityLevel: summary.profile.activityLevel,
        goal: summary.profile.goal,
        targetWeightKg: summary.profile.targetWeightKg,
        customCalorieTarget: summary.profile.customCalorieTarget,
        proteinPerKg: macros.proteinPerKg,
        fatPerKg: macros.fatPerKg,
      },
      { onSettled: () => setPendingStrategy(null) },
    )
  }

  return (
    <Card
      className="overflow-hidden !p-0"
      style={{ borderColor: 'var(--surface-border-soft)', boxShadow: '0 18px 45px color-mix(in srgb, var(--fg-1) 10%, transparent)' }}
    >
      <div
        className="border-b px-5 py-4 sm:px-6"
        style={{
          borderColor: 'var(--border-1)',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--bg-3) 82%, transparent), var(--bg-1))',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--bg-3)', color: 'var(--color-primary)' }}>
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tn.nutritionInsight}</p>
              <h2 className="text-xl font-semibold leading-tight text-text">{tn.nutritionInsightTitle}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{tn.nutritionInsightSubtitle}</p>
            </div>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
            {tn.last14Days}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-44 items-center justify-center"><Spinner /></div>
      ) : (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <InsightMetric icon={<Scale size={17} />} label={tn.weightGap} value={insight.weightGap} detail={insight.weightNote} />
            <InsightMetric icon={<Flame size={17} />} label={tn.calorieConsistency} value={insight.calorieConsistency} detail={insight.calorieNote} />
            <InsightMetric icon={<Utensils size={17} />} label={tn.macroBalance} value={insight.macroBalance} detail={insight.macroNote} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-xl border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={17} className="text-primary" />
                <h3 className="font-semibold text-text">{tn.nutritionNextMove}</h3>
              </div>
              <div className="space-y-3">
                {insight.actions.map((action, index) => (
                  <div key={action.title} className="grid grid-cols-[2rem_1fr] gap-3 rounded-lg px-3 py-3" style={{ background: 'var(--bg-1)' }}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-text">{action.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{action.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
              <div className="mb-4 flex items-center gap-2">
                <Utensils size={17} className="text-primary" />
                <h3 className="font-semibold text-text">{tn.foodPlanTitle}</h3>
              </div>
              <div className="space-y-3">
                {insight.foodSuggestions.map((item) => (
                  <FoodSuggestionCard key={item.title} item={item} labels={tn} />
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-xl border p-4" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={17} className="text-primary" />
              <h3 className="font-semibold text-text">{tn.macroStrategyTitle}</h3>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {insight.macroStrategies.map((strategy) => (
                <MacroStrategyCard
                  key={strategy.title}
                  strategy={strategy}
                  labels={tn}
                  selected={isStrategyActive(strategy, calc)}
                  canSelect={canSelectStrategy}
                  applying={pendingStrategy === strategy.title}
                  disabled={applyingStrategy}
                  onSelect={() => handleSelectStrategy(strategy)}
                  showActions={!clientId}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </Card>
  )
}

function FoodSuggestionCard({
  item,
  labels,
}: {
  item: { title: string; amount: string; reason: string; examples: string[] }
  labels: Record<string, string>
}) {
  return (
    <div
      className="rounded-lg border p-3 sm:p-4"
      style={{
        borderColor: 'var(--border-1)',
        background: 'linear-gradient(135deg, var(--bg-1), color-mix(in srgb, var(--bg-3) 38%, var(--bg-1)))',
      }}
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.72fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="max-w-[18rem] text-base font-semibold leading-snug text-text">{item.title}</p>
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
              {item.amount}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{item.reason}</p>
        </div>

        <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--border-1)', background: 'color-mix(in srgb, var(--bg-2) 72%, transparent)' }}>
          <div className="flex flex-wrap gap-1.5">
            {item.examples.map((example) => (
              <span
                key={example}
                className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted"
                style={{ borderColor: 'var(--border-1)', background: 'var(--bg-1)' }}
              >
                {example}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase leading-4 tracking-wide text-muted">{labels.suggestedServing}</p>
        </div>
      </div>
    </div>
  )
}

function MacroStrategyCard({
  strategy,
  labels,
  selected,
  canSelect,
  applying,
  disabled,
  onSelect,
  showActions = true,
}: {
  strategy: MacroStrategy
  labels: Record<string, string>
  selected: boolean
  canSelect: boolean
  applying: boolean
  disabled: boolean
  onSelect: () => void
  showActions?: boolean
}) {
  const macroRows = [
    { key: 'protein', label: labels.proteinShort, pct: strategy.proteinPct, grams: strategy.proteinG, color: MACRO_COLORS.protein },
    { key: 'carbs', label: labels.carbsShort, pct: strategy.carbsPct, grams: strategy.carbsG, color: MACRO_COLORS.carbs },
    { key: 'fat', label: labels.fatShort, pct: strategy.fatPct, grams: strategy.fatG, color: MACRO_COLORS.fat },
  ]

  return (
    <div
      className="flex flex-col rounded-lg border p-4"
      style={{
        borderColor: selected ? 'var(--xn-success)' : strategy.recommended ? 'var(--color-primary)' : 'var(--border-1)',
        background: selected
          ? 'color-mix(in srgb, var(--xn-success) 9%, var(--bg-1))'
          : strategy.recommended
            ? 'color-mix(in srgb, var(--color-primary) 7%, var(--bg-1))'
            : 'var(--bg-1)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text">{strategy.title}</p>
          <p className="mt-1 text-xs text-muted">
            {strategy.calories ? `${strategy.calories} ${labels.kcal}` : labels.missing}
          </p>
        </div>
        {selected ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: 'color-mix(in srgb, var(--xn-success) 18%, transparent)', color: 'var(--xn-success)' }}
          >
            <Check size={12} />
            {labels.strategySelected}
          </span>
        ) : strategy.recommended ? (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}>
            {labels.recommended}
          </span>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-full border" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
        <div className="flex h-3">
          {macroRows.map((row) => (
            <span key={row.key} style={{ width: `${row.pct}%`, background: row.color }} />
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {macroRows.map((row) => (
          <div key={row.key} className="rounded-md px-2 py-2" style={{ background: 'var(--bg-2)' }}>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
              <p className="truncate text-[11px] font-semibold uppercase text-muted">{row.label}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-text">{row.pct}%</p>
            <p className="text-xs text-muted">{row.grams == null ? labels.missing : `${row.grams}g`}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 border-t pt-3 text-sm" style={{ borderColor: 'var(--border-1)' }}>
        <p><span className="font-semibold text-text">{labels.splitLabel}:</span> <span className="text-muted">{strategy.mealSplit}</span></p>
        <p><span className="font-semibold text-text">{labels.timingLabel}:</span> <span className="text-muted">{strategy.timing}</span></p>
        <p><span className="font-semibold text-text">{labels.useCaseLabel}:</span> <span className="text-muted">{strategy.whenToUse}</span></p>
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        <p className="rounded-md px-2 py-2" style={{ background: 'var(--bg-2)' }}>
          <span className="font-semibold text-text">{labels.prosLabel}:</span> <span className="text-muted">{strategy.pros}</span>
        </p>
        <p className="rounded-md px-2 py-2" style={{ background: 'var(--bg-2)' }}>
          <span className="font-semibold text-text">{labels.consLabel}:</span> <span className="text-muted">{strategy.cons}</span>
        </p>
      </div>

      {showActions && (
        <div className="mt-auto pt-4">
          {selected ? (
            <Button type="button" size="sm" variant="success" disabled className="w-full">
              <Check size={15} />
              {labels.strategySelected}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={!canSelect || disabled}
              loading={applying}
              onClick={onSelect}
            >
              {!canSelect ? labels.strategyNeedsData : applying ? labels.strategyApplying : labels.strategySelect}
            </Button>
          )}
        </div>
      )}
    </div>
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

function AnalysisStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'good' | 'warn'
}) {
  const color = tone === 'good'
    ? 'var(--xn-success)'
    : tone === 'warn'
      ? 'var(--xn-warning)'
      : 'var(--fg-1)'

  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-1)', border: '1px solid var(--border-1)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 whitespace-nowrap text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
    </div>
  )
}
