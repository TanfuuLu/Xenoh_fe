import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { Spinner } from '@/shared/components/Spinner'
import { AppLayout } from '@/shared/layouts/AppLayout'
import { useAuthStore } from '@/features/auth'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const SocialCallbackPage = lazy(() => import('@/features/auth/pages/SocialCallbackPage').then((m) => ({ default: m.SocialCallbackPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const PlansPage = lazy(() => import('@/features/plans/pages/PlansPage').then((m) => ({ default: m.PlansPage })))
const PlanDetailPage = lazy(() => import('@/features/plans/pages/PlanDetailPage').then((m) => ({ default: m.PlanDetailPage })))
const PlanOverviewPage = lazy(() => import('@/features/plans/pages/PlanOverviewPage').then((m) => ({ default: m.PlanOverviewPage })))
const WeekDetailPage = lazy(() => import('@/features/workouts/pages/WeekDetailPage').then((m) => ({ default: m.WeekDetailPage })))
const WeekAnalyzePage = lazy(() => import('@/features/workouts/pages/WeekAnalyzePage').then((m) => ({ default: m.WeekAnalyzePage })))
const DayWorkoutPage = lazy(() => import('@/features/workouts/pages/DayWorkoutPage').then((m) => ({ default: m.DayWorkoutPage })))
const ExerciseLibraryPage = lazy(() => import('@/features/workouts/pages/ExerciseLibraryPage').then((m) => ({ default: m.ExerciseLibraryPage })))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const ChangePasswordPage = lazy(() => import('@/features/profile/pages/ChangePasswordPage').then((m) => ({ default: m.ChangePasswordPage })))
const ExerciseTrackingPage = lazy(() => import('@/features/exercise-tracking/pages/ExerciseTrackingPage').then((m) => ({ default: m.ExerciseTrackingPage })))
const CoachesPage = lazy(() => import('@/features/coaches/pages/CoachesPage').then((m) => ({ default: m.CoachesPage })))
const ClientsPage = lazy(() => import('@/features/coach-client/pages/ClientsPage').then((m) => ({ default: m.ClientsPage })))
const ClientProfilePage = lazy(() => import('@/features/profile/pages/ClientProfilePage').then((m) => ({ default: m.ClientProfilePage })))
const ClientAiInsightPage = lazy(() => import('@/features/profile/pages/ClientAiInsightPage').then((m) => ({ default: m.ClientAiInsightPage })))
const CoachProfilePage = lazy(() => import('@/features/coaches/pages/CoachProfilePage').then((m) => ({ default: m.CoachProfilePage })))
const ProgressPage = lazy(() => import('@/features/progress/pages/ProgressPage').then((m) => ({ default: m.ProgressPage })))
const NutritionPage = lazy(() => import('@/features/nutrition/pages/NutritionPage').then((m) => ({ default: m.NutritionPage })))
const InsightsPage = lazy(() => import('@/features/insights').then((m) => ({ default: m.InsightsPage })))
const LandingPage = lazy(() => import('@/features/marketing/pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const AboutPage = lazy(() => import('@/features/marketing/pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const SubscriptionPage = lazy(() => import('@/features/billing/pages/SubscriptionPage').then((m) => ({ default: m.SubscriptionPage })))
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
const AdminPlansPage = lazy(() => import('@/features/admin/pages/AdminPlansPage').then((m) => ({ default: m.AdminPlansPage })))
const AdminPaymentsPage = lazy(() => import('@/features/admin/pages/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage })))
const AdminReportsPage = lazy(() => import('@/features/reports/pages/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })))
const BlocklistPage = lazy(() => import('@/features/blocks/pages/BlocklistPage').then((m) => ({ default: m.BlocklistPage })))

function SuspenseFallback() {
  return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--xn-paper)' }}>
      <Spinner size="lg" />
    </div>
  )
}

function Suspended({ children }: { children: ReactNode }) {
  return <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
}

function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const authChecked = useAuthStore((s) => s.authChecked)
  if (!authChecked) return <SuspenseFallback />
  if (!accessToken) return <Navigate to="/login" replace />
  return <Outlet />
}

function RoleRoute({ role, redirectTo = '/dashboard' }: { role: 'Individual' | 'Coach' | 'Admin'; redirectTo?: string }) {
  const roles = useAuthStore((s) => s.user?.roles)
  if (!roles?.includes?.(role)) return <Navigate to={redirectTo} replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Suspended><LandingPage /></Suspended>,
  },
  {
    path: '/about',
    element: <Suspended><AboutPage /></Suspended>,
  },
  {
    path: '/login',
    element: <Suspended><LoginPage /></Suspended>,
  },
  {
    path: '/auth/social-callback',
    element: <Suspended><SocialCallbackPage /></Suspended>,
  },
  {
    path: '/register',
    element: <Suspended><RegisterPage /></Suspended>,
  },
  {
    path: '/forgot-password',
    element: <Suspended><ForgotPasswordPage /></Suspended>,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: 'dashboard',
            element: <Suspended><DashboardPage /></Suspended>,
          },
          {
            path: 'plans',
            element: <Suspended><PlansPage /></Suspended>,
          },
          {
            path: 'plans/:planId',
            element: <Suspended><PlanDetailPage /></Suspended>,
          },
          {
            path: 'plans/:planId/overview',
            element: <Suspended><PlanOverviewPage /></Suspended>,
          },
          {
            path: 'plans/:planId/weeks/:weekId',
            element: <Suspended><WeekDetailPage /></Suspended>,
          },
          {
            path: 'plans/:planId/weeks/:weekId/analyze',
            element: <Suspended><WeekAnalyzePage /></Suspended>,
          },
          {
            path: 'days/:dailyWorkoutId',
            element: <Suspended><DayWorkoutPage /></Suspended>,
          },
          {
            path: 'exercise-library',
            element: <Suspended><ExerciseLibraryPage /></Suspended>,
          },
          {
            path: 'profile',
            element: <Suspended><ProfilePage /></Suspended>,
          },
          {
            path: 'change-password',
            element: <Suspended><ChangePasswordPage /></Suspended>,
          },
          {
            path: 'settings/blocklist',
            element: <Suspended><BlocklistPage /></Suspended>,
          },
          {
            path: 'progress',
            element: <Suspended><ProgressPage /></Suspended>,
          },
          {
            path: 'nutrition',
            element: <Suspended><NutritionPage /></Suspended>,
          },
          {
            path: 'insights',
            element: <Suspended><InsightsPage /></Suspended>,
          },
          {
            path: 'leaderboard',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'subscription',
            element: <Suspended><SubscriptionPage /></Suspended>,
          },
          {
            path: 'coaches',
            element: <Suspended><CoachesPage /></Suspended>,
          },
          {
            path: 'coaches/:coachId',
            element: <Suspended><CoachProfilePage /></Suspended>,
          },
          {
            element: <RoleRoute role="Individual" />,
            children: [
              {
                path: 'exercise-tracking',
                element: <Suspended><ExerciseTrackingPage /></Suspended>,
              },
            ],
          },
          {
            element: <RoleRoute role="Coach" redirectTo="/subscription?reason=coach-required" />,
            children: [
              {
                path: 'coach/clients',
                element: <Suspended><ClientsPage /></Suspended>,
              },
              {
                path: 'coach/clients/:clientId',
                element: <Suspended><ClientProfilePage /></Suspended>,
              },
              {
                path: 'coach/clients/:clientId/ai-insight',
                element: <Suspended><ClientAiInsightPage /></Suspended>,
              },
              {
                path: 'coach/clients/:clientId/nutrition',
                element: <Suspended><NutritionPage /></Suspended>,
              },
              {
                path: 'coach/plans',
                element: <Navigate to="/plans" replace />,
              },
            ],
          },
          {
            element: <RoleRoute role="Admin" />,
            children: [
              {
                path: 'admin',
                element: <Navigate to="/admin/dashboard" replace />,
              },
              {
                path: 'admin/dashboard',
                element: <Suspended><AdminDashboardPage /></Suspended>,
              },
              {
                path: 'admin/reports',
                element: <Suspended><AdminReportsPage /></Suspended>,
              },
              {
                path: 'admin/users',
                element: <Suspended><AdminUsersPage /></Suspended>,
              },
              {
                path: 'admin/plans',
                element: <Suspended><AdminPlansPage /></Suspended>,
              },
              {
                path: 'admin/payments',
                element: <Suspended><AdminPaymentsPage /></Suspended>,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
