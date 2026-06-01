import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { Calculator, Dumbbell, Flame, Sparkles, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { enUS, vi as viLocale } from 'date-fns/locale'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Modal } from '@/shared/components/Modal'
import { Spinner } from '@/shared/components/Spinner'
import { softCardGroup, softCardItem } from '@/shared/utils/motion'
import { useLangStore, useT } from '@/shared/i18n'
import { DailyTipCard } from '@/features/tips'
import { usePersonalDashboard } from '../api/usePersonalDashboard'
import { LevelCard, MetricCard } from '../components/dashboardWidgets'
import {
  BodyweightPanel,
  NextActionsPanel,
  NutritionPanel,
  PlanPanel,
  ProInsightsPanel,
  TodayPanel,
} from '../components/DashboardPanels'
import { PlateCalculatorBody, getPlateCalculator } from '../components/PlateCalculator'

export function DashboardPage() {
  const shouldReduce = useReducedMotion()
  const lang = useLangStore((s) => s.lang)
  const td = useT().dashboard
  const dateLocale = lang === 'vi' ? viLocale : enUS
  const { data, isLoading, isError } = usePersonalDashboard()
  const [plateCalcOpen, setPlateCalcOpen] = useState(false)
  const [plateInput, setPlateInput] = useState<{ value: string; unit: 'kg' | 'lbs' }>({
    value: '100',
    unit: 'kg',
  })
  const plateCalculator = useMemo(
    () => getPlateCalculator(Number(plateInput.value), plateInput.unit),
    [plateInput],
  )

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  }

  if (isError || !data) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-muted">{td.loadError}</p>
      </Card>
    )
  }

  const today = new Date()
  const profile = data.profile
  const xpAtLevelStart = (profile.level * (profile.level - 1)) / 2 * 1000
  const xpIntoLevel = Math.max(0, profile.totalXp - xpAtLevelStart)
  const xpPct = profile.xpToNextLevel > 0
    ? Math.min(100, Math.round((xpIntoLevel / profile.xpToNextLevel) * 100))
    : 0

  return (
    <motion.div
      initial={shouldReduce ? false : 'hidden'}
      animate="visible"
      variants={shouldReduce ? undefined : softCardGroup}
      className="space-y-6"
    >
      <motion.section
        variants={shouldReduce ? undefined : softCardItem}
        className="xn-dashboard-hero overflow-hidden rounded-2xl bg-surface p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, var(--bg-2), var(--bg-1))' }}
      >
        <motion.div variants={shouldReduce ? undefined : softCardItem} className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">
              {format(today, 'EEEE, d MMMM yyyy', { locale: dateLocale })}
            </p>
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <h1 className="text-2xl font-bold text-text sm:text-3xl">
                {td.welcomeBack.replace('{name}', profile.firstName || td.fallbackName)}
              </h1>
              <DailyTipCard />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {td.dailyCommand}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/insights">
              <Button size="sm" className="gap-1.5">
                <Sparkles size={15} /> {td.aiInsights}
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPlateCalcOpen(true)}
              className="gap-1.5"
            >
              <Calculator size={15} /> {td.plateCalculatorTitle}
            </Button>
          </div>
        </motion.div>

        <motion.div
          variants={shouldReduce ? undefined : softCardGroup}
          className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <LevelCard
            levelLabel={td.level.replace('{n}', String(profile.level))}
            title={profile.title}
            xpText={`${xpIntoLevel.toLocaleString()} / ${profile.xpToNextLevel.toLocaleString()} XP`}
            progress={xpPct}
          />
          <MetricCard icon={<Flame size={18} />}     label={td.streak}     value={td.streakValue.replace('{n}', String(profile.currentStreak))}    accent="#f97316" />
          <MetricCard icon={<TrendingUp size={18} />} label={td.bodyweight} value={profile.latestBodyweight ? `${profile.latestBodyweight} kg` : '-'} accent="#06b6d4" />
          <MetricCard icon={<Dumbbell size={18} />}   label="DOTS"          value={profile.dotsScore ? profile.dotsScore.toFixed(1) : '-'}               accent="#6366f1" />
        </motion.div>

        <motion.div variants={shouldReduce ? undefined : softCardGroup} className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <TodayPanel workout={data.todayWorkout} />
          <PlanPanel plan={data.activePlan} />
        </motion.div>
      </motion.section>

      <BodyweightPanel latestBodyweight={profile.latestBodyweight} />

      <motion.div variants={shouldReduce ? undefined : softCardGroup} className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <NutritionPanel nutrition={data.nutritionToday} />
        <NextActionsPanel actions={data.nextActions} />
      </motion.div>

      <ProInsightsPanel
        unlocked={data.proInsights.isUnlocked}
        ctaLabel={data.proInsights.ctaLabel}
        ctaRoute={data.proInsights.ctaRoute}
        insights={data.proInsights.items}
      />

      <Modal
        open={plateCalcOpen}
        onClose={() => setPlateCalcOpen(false)}
        title={td.plateCalculatorTitle}
        className="max-w-2xl"
      >
        <PlateCalculatorBody
          input={plateInput}
          onInputChange={setPlateInput}
          calculator={plateCalculator}
        />
      </Modal>
    </motion.div>
  )
}
