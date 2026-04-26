import { Link, useParams } from 'react-router'
import { motion } from 'framer-motion'
import { ChevronLeft, Users, Mail } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useCoachProfile } from '../index'

export function CoachProfilePage() {
  const { coachId = '' } = useParams()
  const { data: coach, isLoading } = useCoachProfile(coachId)
  const t   = useT()
  const tcp = t.coachProfile

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!coach) return <p className="text-muted">{tcp.notFound}</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/coaches">
          <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-text">{coach.fullName}</h1>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid gap-4 md:grid-cols-2"
      >
        {/* Coach card */}
        <motion.div variants={slideUp}>
          <Card className="space-y-4">
            {/* Avatar placeholder */}
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                {coach.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-text">{coach.fullName}</h2>
                <p className="text-sm text-muted">Coach</p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-2 text-muted">
              <Mail size={15} />
              <span className="text-sm">{coach.email}</span>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div variants={slideUp}>
          <Card className="flex flex-col justify-center space-y-4">
            <div
              className="flex flex-col items-center justify-center rounded-xl py-6"
              style={{ background: 'var(--bg-3)' }}
            >
              <Users size={28} style={{ color: 'var(--color-primary)' }} />
              <p className="mt-2 text-4xl font-black text-text">{coach.totalClients}</p>
              <p className="text-sm text-muted">{tcp.totalClients}</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
