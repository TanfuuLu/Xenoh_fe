import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion } from 'framer-motion'
import { ChevronLeft, Users, Mail, FileText, Star, Flag, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Modal } from '@/shared/components/Modal'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { slideUp, staggerContainer } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useCreateUserReport } from '@/features/reports'
import type { ReportReason } from '@/shared/types/api'
import { useCoachProfile, useCreateCoachRating, useDeleteCoachRating, useUpdateCoachRating } from '../index'

export function CoachProfilePage() {
  const { coachId = '' } = useParams()
  const { data: coach, isLoading } = useCoachProfile(coachId)
  const createRating = useCreateCoachRating(coachId)
  const updateRating = useUpdateCoachRating(coachId)
  const deleteRating = useDeleteCoachRating(coachId)
  const createReport = useCreateUserReport(coachId)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('Other')
  const [reportDetails, setReportDetails] = useState('')
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

  const myRating = coach.myRating

  function submitRating() {
    const payload = { rating, comment: comment.trim() || null }
    if (myRating) updateRating.mutate(payload)
    else createRating.mutate(payload)
  }

  function submitReport() {
    createReport.mutate(
      { reason: reportReason, details: reportDetails },
      {
        onSuccess: () => {
          setReportOpen(false)
          setReportReason('Other')
          setReportDetails('')
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-2">
        <Link to="/coaches">
          <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
        </Link>
        <h1 className="min-w-0 break-words text-2xl font-bold text-text">{coach.fullName}</h1>
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
            <div className="flex min-w-0 items-center gap-4">
              <UserAvatar
                name={coach.fullName}
                email={coach.email}
                imageUrl={coach.avatarUrl}
                size={64}
                variant="primary"
              />
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-text">{coach.fullName}</h2>
                <p className="text-sm text-muted">Coach</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  <Star size={15} fill="currentColor" />
                  {coach.averageRating?.toFixed(1) ?? '-'} ({coach.ratingCount})
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-center gap-2 text-muted">
              <Mail size={15} />
              <span className="min-w-0 truncate text-sm">{coach.email}</span>
            </div>

            {/* Bio */}
            <div className="flex gap-2 text-muted">
              <FileText size={15} className="mt-0.5 flex-shrink-0" />
              <p className="break-words text-sm leading-relaxed">
                {coach.bio ?? 'No bio added yet.'}
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
              <Flag size={15} /> Report user
            </Button>
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

      {coach.canRate && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-text">{myRating ? 'Your review' : 'Rate this coach'}</h2>
            {myRating && (
              <Button variant="danger" size="sm" loading={deleteRating.isPending} onClick={() => deleteRating.mutate()}>
                <Trash2 size={15} /> Delete
              </Button>
            )}
          </div>
          {myRating && (
            <p className="text-sm text-muted">
              Current: {myRating.rating}/5{myRating.comment ? ` - ${myRating.comment}` : ''}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
            <Select
              label="Rating"
              value={String(rating)}
              onChange={(value) => setRating(Number(value || 5))}
              options={[1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: `${value} star${value > 1 ? 's' : ''}` }))}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">Comment</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                className="xn-input min-h-11 resize-y"
                placeholder="Optional review..."
              />
            </label>
            <div className="flex items-end">
              <Button loading={createRating.isPending || updateRating.isPending} onClick={submitRating}>
                <Star size={15} /> {myRating ? 'Update' : 'Submit'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-text">Reviews</h2>
        {coach.ratings.length === 0 ? (
          <p className="text-sm text-muted">No reviews yet.</p>
        ) : (
          coach.ratings.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-panel px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-text">{item.clientName}</p>
                <p className="flex items-center gap-1 text-sm text-muted">
                  <Star size={14} fill="currentColor" /> {item.rating}/5
                </p>
              </div>
              {item.comment && <p className="mt-1 text-sm text-muted">{item.comment}</p>}
            </div>
          ))
        )}
      </Card>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report user">
        <div className="space-y-4">
          <Select
            label="Reason"
            value={reportReason}
            onChange={(value) => setReportReason((value || 'Other') as ReportReason)}
            options={['Harassment', 'Spam', 'Scam', 'Inappropriate', 'Other'].map((value) => ({ value, label: value }))}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">Details</span>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              maxLength={2000}
              className="xn-input min-h-28 resize-y"
              placeholder="Describe what happened..."
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={createReport.isPending}
              disabled={!reportDetails.trim()}
              onClick={submitReport}
            >
              Submit report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
