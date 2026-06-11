import { Sparkles, Target, CheckCircle2 } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import type { PowerliftingSection } from '../types'
import { translateLiftName } from './progressFormat'

interface PowerliftingAiSummary {
  title: string
  detail: string
  priorityLift: string
  actions: string[]
  cards: Array<{ title: string; detail: string; metric: string }>
}

export function PowerliftingAiFocusPanel({ section, tp }: { section: PowerliftingSection; tp: Record<string, string> }) {
  const summary = buildPowerliftingAiSummary(section, tp)

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-text">{tp.powerliftingAiTitle}</h2>
          <Badge>{tp.powerliftingTab}</Badge>
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
          <Target size={15} />
          {tp.powerliftingAiLabel}
        </div>
        <p className="mt-2 font-semibold text-text">{summary.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{summary.detail}</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {summary.actions.map((action) => (
            <li key={action} className="flex items-start gap-2 text-sm text-text">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {summary.cards.map((card) => (
          <div key={card.title} className="rounded-xl border p-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.title}</p>
            <p className="mt-2 font-semibold text-text">{card.metric}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{card.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function buildPowerliftingAiSummary(section: PowerliftingSection, tp: Record<string, string>): PowerliftingAiSummary {
  const lifts = [section.squat, section.bench, section.deadlift]
  const plateauLift = lifts.find((lift) => lift.isPlateau)
  const squat = section.squat.currentE1Rm
  const bench = section.bench.currentE1Rm
  const deadlift = section.deadlift.currentE1Rm
  const benchRatio = squat && bench ? bench / squat : null
  const deadliftRatio = squat && deadlift ? deadlift / squat : null
  const allPrs = lifts
    .flatMap((lift) => lift.prTimeline.map((pr) => ({ ...pr, lift: lift.lift })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const latestDots = section.dots.length > 0 ? section.dots[section.dots.length - 1] : undefined
  // DOTS needs all three lifts logged in this plan plus a bodyweight entry. When the
  // series is empty, distinguish "a lift hasn't been logged yet" from "no bodyweight"
  // so we don't tell the user to log bodyweight they already have.
  const missingLifts = lifts.filter((lift) => lift.currentE1Rm == null)
  const missingLiftNames = missingLifts.map((lift) => translateLiftName(lift.lift, tp)).join(', ')

  let title = tp.powerliftingAiKeepBuilding
  let detail = tp.powerliftingAiKeepBuildingDetail
  let priorityLift = tp.squat

  if (!latestDots) {
    if (missingLifts.length > 0) {
      title = tp.powerliftingAiNeedLifts
      detail = tp.powerliftingAiNeedLiftsDetail.replace('{lifts}', missingLiftNames)
    } else {
      title = tp.powerliftingAiNeedBodyweight
      detail = tp.powerliftingAiNeedBodyweightDetail
    }
  } else if (plateauLift) {
    priorityLift = translateLiftName(plateauLift.lift, tp)
    title = tp.powerliftingAiPlateau.replace('{lift}', priorityLift)
    detail = tp.powerliftingAiPlateauDetail.replace(/\{lift\}/g, priorityLift)
  } else if (benchRatio != null && benchRatio < 0.6) {
    priorityLift = tp.bench
    title = tp.powerliftingAiBenchLag
    detail = tp.powerliftingAiBenchLagDetail
  } else if (deadliftRatio != null && deadliftRatio < 1.05) {
    priorityLift = tp.deadlift
    title = tp.powerliftingAiDeadliftLag
    detail = tp.powerliftingAiDeadliftLagDetail
  }

  const latestPr = allPrs[0]
  const dotsAction = latestDots
    ? tp.powerliftingAiActionPr
    : missingLifts.length > 0
      ? tp.powerliftingAiActionLogLifts.replace('{lifts}', missingLiftNames)
      : tp.powerliftingAiActionBodyweight
  const actions = [
    tp.powerliftingAiActionWeakLift.replace('{lift}', priorityLift),
    tp.powerliftingAiActionTechnique,
    dotsAction,
  ]

  return {
    title,
    detail,
    priorityLift,
    actions,
    cards: [
      {
        title: tp.powerliftingBalanceTitle,
        metric: strongestLiftLabel(section, tp),
        detail: tp.powerliftingBalanceDetail
          .replace('{squat}', formatLiftValue(section.squat.currentE1Rm, tp))
          .replace('{bench}', formatLiftValue(section.bench.currentE1Rm, tp))
          .replace('{deadlift}', formatLiftValue(section.deadlift.currentE1Rm, tp)),
      },
      {
        title: tp.powerliftingPrTitle,
        metric: `${allPrs.length}`,
        detail: latestPr
          ? tp.powerliftingPrDetail
              .replace('{count}', String(allPrs.length))
              .replace('{latest}', `${translateLiftName(latestPr.lift, tp)} ${latestPr.e1Rm.toFixed(1)} ${tp.kgUnit}`)
          : tp.powerliftingNoPrDetail,
      },
      {
        title: tp.powerliftingDotsTitle,
        metric: latestDots ? latestDots.dots.toFixed(1) : '—',
        detail: latestDots
          ? tp.powerliftingDotsDetail
              .replace('{dots}', latestDots.dots.toFixed(1))
              .replace('{bodyweight}', latestDots.bodyweightKg.toFixed(1))
          : tp.powerliftingNoDotsDetail,
      },
    ],
  }
}

function strongestLiftLabel(section: PowerliftingSection, tp: Record<string, string>) {
  const lifts = [section.squat, section.bench, section.deadlift]
    .filter((lift) => lift.currentE1Rm != null)
    .sort((a, b) => (b.currentE1Rm ?? 0) - (a.currentE1Rm ?? 0))
  const top = lifts[0]
  return top ? `${translateLiftName(top.lift, tp)} ${formatLiftValue(top.currentE1Rm, tp)}` : '—'
}

function formatLiftValue(value: number | null, tp: Record<string, string>) {
  return value == null ? '—' : `${value.toFixed(1)} ${tp.kgUnit}`
}
