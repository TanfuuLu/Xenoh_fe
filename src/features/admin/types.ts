import type { Gender, PlanType, RelationshipStatus, UserRole } from '@/shared/types/api'

export type PlanTier = 'Free' | 'ProIndividual' | 'ProCoach'
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Expired'

export interface AdminMetricPoint {
  label: string
  value: number
}

export interface AdminDashboardResponse {
  totalUsers: number
  newUsersThisMonth: number
  activeCoaches: number
  activePaidSubscriptions: number
  pendingReports: number
  completedPaymentRevenueThisMonth: number
  totalPlansCreated: number
  completedWorkoutDays: number
  userRegistrations: AdminMetricPoint[]
  revenue: AdminMetricPoint[]
  subscriptionTierDistribution: AdminMetricPoint[]
  planCompletionTrend: AdminMetricPoint[]
}

export interface AdminStatusCount {
  status: string
  count: number
}

export interface AdminReportSummaryResponse {
  total: number
  countsByStatus: AdminStatusCount[]
}

export interface AdminUserListItem {
  id: string
  email: string
  fullName: string
  roles: UserRole[]
  subscriptionTier: PlanTier
  isSubscriptionActive: boolean
  isSuspended: boolean
  createdAt: string
  planCount: number
  workoutHistoryCount: number
  reportsMadeCount: number
  reportsReceivedCount: number
}

export interface AdminUserRelationship {
  relationshipId: string
  userId: string
  userName: string
  userEmail: string
  status: RelationshipStatus
}

export interface AdminUserDetail extends AdminUserListItem {
  subscriptionExpiresAt: string | null
  height: number | null
  gender: Gender | null
  dateOfBirth: string | null
  bio: string | null
  avatarUrl: string | null
  coachRelationship: AdminUserRelationship | null
  clientRelationships: AdminUserRelationship[]
}

export interface AdminPlanListItem {
  id: string
  name: string
  planType: PlanType
  ownerId: string
  ownerName: string
  ownerEmail: string
  createdByCoachId: string | null
  coachName: string | null
  coachEmail: string | null
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  totalWeeks: number
  totalDays: number
  completedDays: number
  completionPercent: number
  totalExercises: number
  totalCompletedSets: number
  totalVolume: number
}

export type AdminPlanAnalytics = AdminPlanListItem

export interface AdminPaymentOrder {
  id: string
  userId: string
  userName: string
  userEmail: string
  requestedTier: PlanTier
  durationMonths: number
  amount: number
  status: PaymentStatus
  transferCode: string
  sePayTransactionId: string | null
  sePayReferenceCode: string | null
  createdAt: string
  expiresAt: string
  paidAt: string | null
}

export interface AdminPaymentSummary {
  totalRevenue: number
  revenueThisMonth: number
  pendingAmount: number
  completedOrders: number
  activePaidSubscriptions: number
  proIndividualSubscriptions: number
  proCoachSubscriptions: number
}

export interface AdminSubscription {
  userId: string
  userName: string
  userEmail: string
  tier: PlanTier
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}
