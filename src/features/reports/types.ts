import type { ReportReason, ReportStatus } from '@/shared/types/api'

export interface UserReportResponse {
  id: string
  reporterId: string
  reporterName: string
  reportedUserId: string
  reportedUserName: string
  reportedUserEmail: string
  reason: ReportReason
  details: string
  status: ReportStatus
  adminNote: string | null
  reviewedById: string | null
  reviewedByName: string | null
  reviewedAtUtc: string | null
  createdAt: string
}

export interface CreateUserReportRequest {
  reason: ReportReason
  details: string
}

export interface ReviewReportRequest {
  status: Exclude<ReportStatus, 'Pending'>
  adminNote?: string | null
}
