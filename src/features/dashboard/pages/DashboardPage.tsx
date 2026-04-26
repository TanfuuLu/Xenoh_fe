import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router'
import { Flame, TrendingUp, Calendar, ChevronRight, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'
import { vi as viLocale, enUS } from 'date-fns/locale'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT, useLangStore } from '@/shared/i18n'
import { useMyProfile } from '@/features/profile'
import { usePlans } from '@/features/plans'

export function DashboardPage() {
  const shouldReduce = useReducedMotion()
  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { data: plans, isLoading: plansLoading } = usePlans()
  const t   = useT()
  const td  = t.dashboard
  const tc  = t.common
  const lang = useLangStore((s) => s.lang)
  const dateLocale = lang === 'vi' ? viLocale : enUS

  const activePlan = plans?.find((p) => p.isActive)

  if (profileLoading || plansLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
  }

  const progressPct = activePlan
    ? Math.round((activePlan.completedDays / activePlan.totalDays) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">
          {td.greeting}, {profile?.firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
        </p>
      </div>

      {/* Stat cards */}
      <motion.div
        initial={shouldReduce ? false : 'hidden'}
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <StatCard icon={<Flame size={20} className="text-warning" />}   label={td.streak} value={`${profile?.currentStreak ?? 0} ${tc.days}`} />
        <StatCard icon={<TrendingUp size={20} className="text-success" />} label={td.weight} value={profile?.latestBodyweight ? `${profile.latestBodyweight} kg` : '—'} />
        <StatCard icon={<Calendar size={20} className="text-primary" />} label="BMI"       value={profile?.bmi ? profile.bmi.toFixed(1) : '—'} sub={profile?.bmiCategory ?? undefined} />
        <StatCard icon={<Dumbbell size={20} className="text-muted" />}   label="DOTS"      value={profile?.dotsScore ? profile.dotsScore.toFixed(1) : '—'} />
      </motion.div>

      {/* Active plan */}
      {activePlan ? (
        <Card className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{td.activePlanLabel}</p>
              <h2 className="mt-1 text-lg font-semibold text-text">{activePlan.name}</h2>
              <p className="text-sm text-muted">
                {format(new Date(activePlan.startDate), 'dd/MM/yyyy')} → {format(new Date(activePlan.endDate), 'dd/MM/yyyy')}
              </p>
            </div>
            <Badge variant="success">{tc.active}</Badge>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>{activePlan.completedDays} / {activePlan.totalDays} {tc.days}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-1)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>
          <Link to={`/plans/${activePlan.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {td.viewDetails} <ChevronRight size={14} />
          </Link>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Dumbbell size={40} className="text-muted/40" />
          <p className="text-muted">{td.noActivePlan}</p>
          <Link to="/plans" className="text-sm font-medium text-primary hover:underline">{td.createPlanLink}</Link>
        </Card>
      )}
    </div>
  )
}

interface StatCardProps { icon: React.ReactNode; label: string; value: string; sub?: string }
function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <motion.div variants={slideUp} className={cn('rounded-xl border border-border bg-surface p-4')}>
      <div className="mb-2">{icon}</div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </motion.div>
  )
}
