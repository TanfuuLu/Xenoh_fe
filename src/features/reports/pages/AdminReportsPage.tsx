import { useState } from 'react'
import { Flag, Shield, UserX, UserCheck } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import type { ReportReason, ReportStatus } from '@/shared/types/api'
import { useAdminReportSummary } from '@/features/admin'
import { MetricCard } from '@/features/admin/components/AdminPageParts'
import { useAdminReports, useReviewReport, useSuspendUser, useUnsuspendUser } from '../index'

export function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus | ''>('Pending')
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const { data: summary } = useAdminReportSummary()
  const { data: reports, isLoading } = useAdminReports({ status, reason })
  const reviewReport = useReviewReport()
  const suspendUser = useSuspendUser()
  const unsuspendUser = useUnsuspendUser()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={22} style={{ color: 'var(--color-primary)' }} />
        <div>
          <h1 className="text-2xl font-bold text-text">User Reports</h1>
          <p className="text-sm text-muted">Review reports and moderate user accounts.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total reports" value={summary?.total ?? 0} />
        {['Pending', 'Resolved', 'Dismissed'].map((item) => (
          <MetricCard
            key={item}
            label={item}
            value={summary?.countsByStatus.find((statusCount) => statusCount.status === item)?.count ?? 0}
          />
        ))}
      </div>

      <Card className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Status"
          value={status}
          placeholder="All statuses"
          onChange={(value) => setStatus(value as ReportStatus | '')}
          options={['Pending', 'Resolved', 'Dismissed'].map((value) => ({ value, label: value }))}
        />
        <Select
          label="Reason"
          value={reason}
          placeholder="All reasons"
          onChange={(value) => setReason(value as ReportReason | '')}
          options={['Harassment', 'Spam', 'Scam', 'Inappropriate', 'Other'].map((value) => ({ value, label: value }))}
        />
      </Card>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><Spinner /></div>
      ) : reports?.length === 0 ? (
        <Card><p className="py-6 text-center text-sm text-muted">No reports found.</p></Card>
      ) : (
        <div className="space-y-3">
          {reports?.map((report) => (
            <Card key={report.id} className="space-y-4" animate={false}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Flag size={16} style={{ color: 'var(--color-danger)' }} />
                    <h2 className="font-semibold text-text">{report.reason}</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {report.reporterName} reported {report.reportedUserName} ({report.reportedUserEmail})
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">{report.status}</span>
              </div>

              <p className="rounded-xl bg-panel px-3 py-2 text-sm text-text">{report.details}</p>

              {report.adminNote && <p className="text-sm text-muted">Admin note: {report.adminNote}</p>}

              <textarea
                value={notes[report.id] ?? ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                className="xn-input min-h-20 resize-y"
                placeholder="Optional admin note..."
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  loading={reviewReport.isPending}
                  onClick={() => reviewReport.mutate({ id: report.id, payload: { status: 'Resolved', adminNote: notes[report.id] || null } })}
                >
                  Resolve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={reviewReport.isPending}
                  onClick={() => reviewReport.mutate({ id: report.id, payload: { status: 'Dismissed', adminNote: notes[report.id] || null } })}
                >
                  Dismiss
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={suspendUser.isPending}
                  onClick={() => suspendUser.mutate(report.reportedUserId)}
                >
                  <UserX size={15} /> Suspend user
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={unsuspendUser.isPending}
                  onClick={() => unsuspendUser.mutate(report.reportedUserId)}
                >
                  <UserCheck size={15} /> Unsuspend user
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
