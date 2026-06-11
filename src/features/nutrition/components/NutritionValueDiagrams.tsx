import { Cell, Pie, PieChart } from 'recharts'
import { Flame, Target } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import type { NutritionSummaryResponse } from '../types'
import { formatKcal, MACRO_COLORS } from './nutritionHelpers'

export function MetricCard({
  icon,
  label,
  value,
  accent = 'var(--color-primary)',
  sub,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  accent?: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <Card
      animate={false}
      className="flex items-center gap-3"
      style={
        highlight
          ? { borderColor: accent, background: `color-mix(in oklch, ${accent} 7%, var(--xn-paper))` }
          : undefined
      }
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in oklch, ${accent} 16%, transparent)`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
        <p className="truncate text-xl font-bold leading-tight text-text">{value}</p>
        {sub && <p className="truncate text-xs text-muted">{sub}</p>}
      </div>
    </Card>
  )
}

export function NutritionValueDiagrams({
  summary,
  caloriesActual,
  proteinActual,
  carbsActual,
  fatActual,
  tn,
}: {
  summary: NutritionSummaryResponse
  caloriesActual: number
  proteinActual: number
  carbsActual: number
  fatActual: number
  tn: Record<string, string>
}) {
  const calc = summary.calculation
  const targetMax = Math.max(calc.bmr ?? 0, calc.tdee ?? 0, calc.calorieTarget ?? 0, 1)
  const energyRows = [
    { label: tn.bmrLabel, value: calc.bmr },
    { label: tn.tdeeLabel, value: calc.tdee },
    { label: tn.targetLabel, value: calc.calorieTarget },
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Target size={17} className="text-primary" />
          <h2 className="text-lg font-semibold text-text">{tn.macroTargetsTitle}</h2>
        </div>

        <CaloriesBar
          actual={caloriesActual}
          target={calc.calorieTarget}
          unit={tn.kcal}
          missingLabel={tn.missing}
        />

        <div className="mt-5">
          <MacroDonut
            proteinG={proteinActual}
            carbsG={carbsActual}
            fatG={fatActual}
            proteinLabel={tn.proteinShort}
            carbsLabel={tn.carbsShort}
            fatLabel={tn.fatShort}
            proteinTarget={calc.proteinG}
            carbsTarget={calc.carbsG}
            fatTarget={calc.fatG}
            missingLabel={tn.missing}
          />
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Flame size={17} className="text-primary" />
          <h2 className="text-lg font-semibold text-text">{tn.targetLabel}</h2>
        </div>
        <div className="space-y-4">
          {energyRows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-text">{row.label}</span>
                <span className="text-muted">{formatKcal(row.value, tn.kcal, tn.missing)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${row.value ? Math.max(8, (row.value / targetMax) * 100) : 0}%`,
                    background: row.label === tn.targetLabel ? 'var(--color-primary)' : 'var(--xn-clay-700)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-3)' }}>
            <p className="text-muted">{tn.goalLabel}</p>
            <p className="font-semibold text-text">{summary.profile.goal}</p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-3)' }}>
            <p className="text-muted">{tn.bodyweightLabel}</p>
            <p className="font-semibold text-text">
              {calc.bodyweightKg ? `${calc.bodyweightKg} ${tn.kg}` : tn.missing}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MacroDonut({
  proteinG,
  carbsG,
  fatG,
  proteinLabel,
  carbsLabel,
  fatLabel,
  proteinTarget,
  carbsTarget,
  fatTarget,
  missingLabel,
}: {
  proteinG: number
  carbsG: number
  fatG: number
  proteinLabel: string
  carbsLabel: string
  fatLabel: string
  proteinTarget: number | null
  carbsTarget: number | null
  fatTarget: number | null
  missingLabel: string
}) {
  const total = proteinG + carbsG + fatG
  const segments = [
    { label: proteinLabel, value: proteinG, target: proteinTarget, color: MACRO_COLORS.protein },
    { label: carbsLabel,   value: carbsG,   target: carbsTarget,   color: MACRO_COLORS.carbs },
    { label: fatLabel,     value: fatG,     target: fatTarget,     color: MACRO_COLORS.fat },
  ]
  const pieData = total > 0
    ? segments.map((s) => ({ ...s, pieValue: s.value }))
    : [{ label: '', value: 0, target: null, color: 'var(--bg-3)', pieValue: 1 }]

  return (
    <div className="flex items-center gap-4">
      <PieChart width={130} height={130}>
        <Pie
          data={pieData}
          cx={65}
          cy={65}
          innerRadius={36}
          outerRadius={58}
          dataKey="pieValue"
          strokeWidth={2}
          stroke="var(--bg-2)"
          startAngle={90}
          endAngle={-270}
        >
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>

      <div className="flex flex-1 flex-col gap-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="flex-1 text-muted">{s.label}</span>
            <span className="font-semibold text-text">{Math.round(s.value)}g</span>
            <span className="text-xs text-muted">/ {s.target ?? missingLabel}g</span>
          </div>
        ))}
        {total > 0 && (
          <p className="mt-0.5 text-xs text-muted">{Math.round(total)}g total</p>
        )}
      </div>
    </div>
  )
}

function CaloriesBar({
  actual,
  target,
  unit,
  missingLabel,
}: {
  actual: number
  target: number | null
  unit: string
  missingLabel: string
}) {
  const pct = target && target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium" style={{ color: 'var(--fg-1)' }}>Calories</span>
        <span style={{ color: 'var(--fg-3)' }}>
          {Math.round(actual)} / {target ?? missingLabel} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-3)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(actual > 0 ? 2 : 0, pct)}%`,
            background: 'var(--color-primary)',
          }}
        />
      </div>
      <p className="mt-1 text-xs" style={{ color: 'var(--fg-3)' }}>{pct}%</p>
    </div>
  )
}
