import { Link, useParams } from 'react-router'
import { motion } from 'framer-motion'
import { ChevronLeft, Activity, Flame, Scale, Dumbbell, Ruler, CalendarDays, Users } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useClientProfile } from '../index'

export function ClientProfilePage() {
  const { clientId = '' } = useParams()
  const { data: profile, isLoading } = useClientProfile(clientId)
  const t   = useT()
  const tp  = t.profile
  const tcp = t.clientProfile
  const tc  = t.common

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) return <p className="text-muted">{tcp.notFound}</p>

  const genderLabel =
    profile.gender === 'Male'   ? tp.male   :
    profile.gender === 'Female' ? tp.female :
    profile.gender === 'Other'  ? tp.other  : tcp.noData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/coach/clients">
          <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-sm text-muted">{profile.email}</p>
        </div>
      </div>

      {/* Key stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <StatCard
          icon={<Flame size={18} style={{ color: 'var(--color-warning)' }} />}
          label={tp.streakStat}
          value={`${profile.currentStreak} ${tc.days}`}
          highlight={profile.currentStreak > 0}
        />
        <StatCard
          icon={<Scale size={18} style={{ color: 'var(--color-primary)' }} />}
          label="Weight"
          value={profile.latestBodyweight ? `${profile.latestBodyweight} ${tcp.kg}` : tcp.noData}
        />
        <StatCard
          icon={<Activity size={18} style={{ color: 'var(--color-success)' }} />}
          label={tp.bmiStat}
          value={profile.bmi ? `${profile.bmi.toFixed(1)} (${profile.bmiCategory ?? ''})` : tcp.noData}
        />
        <StatCard
          icon={<Dumbbell size={18} style={{ color: 'var(--xn-clay-600)' }} />}
          label={tp.dotsStat}
          value={profile.dotsScore ? profile.dotsScore.toFixed(1) : tcp.noData}
        />
      </motion.div>

      {/* Personal info */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          {tcp.statsHeading}
        </h2>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-2 gap-4 md:grid-cols-3"
        >
          <motion.div variants={slideUp}>
            <InfoRow
              icon={<Ruler size={15} />}
              label={tp.heightStat}
              value={profile.height ? `${profile.height} ${tcp.cm}` : tcp.noData}
            />
          </motion.div>
          <motion.div variants={slideUp}>
            <InfoRow
              icon={<Users size={15} />}
              label={tp.genderStat}
              value={genderLabel}
            />
          </motion.div>
          <motion.div variants={slideUp}>
            <InfoRow
              icon={<CalendarDays size={15} />}
              label={tp.dobStat}
              value={
                profile.dateOfBirth
                  ? format(new Date(profile.dateOfBirth), 'dd/MM/yyyy')
                  : tcp.noData
              }
            />
          </motion.div>
        </motion.div>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <motion.div
      variants={slideUp}
      className="rounded-xl border p-4 space-y-2"
      style={{
        borderColor: highlight ? 'var(--xn-warning)' : 'var(--border-1)',
        background: highlight ? 'var(--xn-warning-bg)' : 'var(--bg-2)',
      }}
    >
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-text">{value}</p>
    </motion.div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-medium text-text">{value}</p>
      </div>
    </div>
  )
}
