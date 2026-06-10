import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { motion } from 'framer-motion'
import { format, subDays, addDays } from 'date-fns'
import { Sparkles, ChevronRight } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { Button } from '@/shared/components/Button'
import { useT } from '@/shared/i18n'
import { useMyProfile } from '@/features/profile'
import { useCycleOverview, useCycleLogs } from '../api/useCycle'
import { CyclePhaseHero } from '../components/CyclePhaseHero'
import { CycleCalendar } from '../components/CycleCalendar'
import { CycleDayLogModal } from '../components/CycleDayLogModal'
import { PhaseGuidancePanel } from '../components/PhaseGuidancePanel'
import { CycleTrendsChart } from '../components/CycleTrendsChart'
import { CycleSettingsModal } from '../components/CycleSettingsModal'

export function CyclePage() {
  const t = useT()
  const tc = t.cycle
  const { data: profile, isLoading: profileLoading } = useMyProfile()

  const today = useMemo(() => new Date(), [])
  const from = format(subDays(today, 120), 'yyyy-MM-dd')
  const to = format(addDays(today, 1), 'yyyy-MM-dd')

  const isFemale = profile?.gender === 'Female'
  const { data: overview, isLoading: overviewLoading } = useCycleOverview(isFemale)
  const { data: logs = [] } = useCycleLogs(from, to, isFemale)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const selectedLog = useMemo(
    () => (selectedDate ? logs.find((l) => l.date === selectedDate) : undefined),
    [logs, selectedDate],
  )

  if (profileLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Backend also enforces this; redirect non-female profiles away.
  if (profile && !isFemale) {
    return <Navigate to="/dashboard" replace />
  }

  function openLog(date: string) {
    setSelectedDate(date)
    setLogModalOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">{tc.title}</h1>
          <p className="mt-1 text-sm text-muted">{tc.subtitle}</p>
        </div>
      </div>

      {overviewLoading || !overview ? (
        <Card className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="space-y-5"
        >
          <CyclePhaseHero
            overview={overview}
            onLogToday={() => openLog(format(today, 'yyyy-MM-dd'))}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <CycleCalendar overview={overview} logs={logs} onSelectDate={openLog} />
            <PhaseGuidancePanel currentPhase={overview.currentPhase} />
          </div>

          <CycleTrendsChart logs={logs} />

          {/* AI insight CTA */}
          <Link to="/cycle/insight">
            <Card
              hover
              className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
              style={{
                borderColor: 'color-mix(in srgb, #f43f5e 24%, var(--border-1))',
                background: 'linear-gradient(135deg, color-mix(in srgb, #f43f5e 12%, var(--bg-1)), var(--bg-1))',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: '#f43f5e' }}
                >
                  <Sparkles size={19} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-text">{tc.insight.cta}</h2>
                  <p className="mt-0.5 text-sm text-muted">{tc.insight.ctaSubtitle}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="self-stretch sm:self-auto">
                {tc.insight.cta} <ChevronRight size={15} />
              </Button>
            </Card>
          </Link>
        </motion.div>
      )}

      <CycleDayLogModal
        open={logModalOpen}
        date={selectedDate}
        log={selectedLog}
        onClose={() => setLogModalOpen(false)}
      />
      <CycleSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
