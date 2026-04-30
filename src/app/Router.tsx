import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { Spinner } from '@/shared/components/Spinner'
import { AppLayout } from '@/shared/layouts/AppLayout'
import { useAuthStore } from '@/features/auth'

// Lazy-loaded pages
const LoginPage        = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage     = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const DashboardPage    = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const PlansPage        = lazy(() => import('@/features/plans/pages/PlansPage').then((m) => ({ default: m.PlansPage })))
const PlanDetailPage   = lazy(() => import('@/features/plans/pages/PlanDetailPage').then((m) => ({ default: m.PlanDetailPage })))
const WeekDetailPage   = lazy(() => import('@/features/workouts/pages/WeekDetailPage').then((m) => ({ default: m.WeekDetailPage })))
const DayWorkoutPage   = lazy(() => import('@/features/workouts/pages/DayWorkoutPage').then((m) => ({ default: m.DayWorkoutPage })))
const ProfilePage      = lazy(() => import('@/features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const ExerciseTrackingPage = lazy(() => import('@/features/exercise-tracking/pages/ExerciseTrackingPage').then((m) => ({ default: m.ExerciseTrackingPage })))
const CoachesPage      = lazy(() => import('@/features/coaches/pages/CoachesPage').then((m) => ({ default: m.CoachesPage })))
const ClientsPage      = lazy(() => import('@/features/coach-client/pages/ClientsPage').then((m) => ({ default: m.ClientsPage })))
const ClientProfilePage = lazy(() => import('@/features/profile/pages/ClientProfilePage').then((m) => ({ default: m.ClientProfilePage })))
const CoachProfilePage  = lazy(() => import('@/features/coaches/pages/CoachProfilePage').then((m) => ({ default: m.CoachProfilePage })))
const LandingPage      = lazy(() => import('@/features/marketing/pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const AboutPage        = lazy(() => import('@/features/marketing/pages/AboutPage').then((m) => ({ default: m.AboutPage })))

function SuspenseFallback() {
  return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--xn-paper)' }}>
      <Spinner size="lg" />
    </div>
  )
}

function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/login" replace />
  return <Outlet />
}

function RoleRoute({ role }: { role: 'Individual' | 'Coach' }) {
  const roles = useAuthStore((s) => s.user?.roles)
  if (!roles?.includes?.(role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/about',
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <AboutPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<SuspenseFallback />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'plans',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <PlansPage />
              </Suspense>
            ),
          },
          {
            path: 'plans/:planId',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <PlanDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'plans/:planId/weeks/:weekId',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <WeekDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'days/:dailyWorkoutId',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <DayWorkoutPage />
              </Suspense>
            ),
          },
          {
            path: 'profile',
            element: (
              <Suspense fallback={<SuspenseFallback />}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'leaderboard',
            element: <Navigate to="/dashboard" replace />,
          },
          // Individual-only
          {
            element: <RoleRoute role="Individual" />,
            children: [
              {
                path: 'exercise-tracking',
                element: (
                  <Suspense fallback={<SuspenseFallback />}>
                    <ExerciseTrackingPage />
                  </Suspense>
                ),
              },
              {
                path: 'coaches',
                element: (
                  <Suspense fallback={<SuspenseFallback />}>
                    <CoachesPage />
                  </Suspense>
                ),
              },
              {
                path: 'coaches/:coachId',
                element: (
                  <Suspense fallback={<SuspenseFallback />}>
                    <CoachProfilePage />
                  </Suspense>
                ),
              },
            ],
          },
          // Coach-only
          {
            element: <RoleRoute role="Coach" />,
            children: [
              {
                path: 'coach/clients',
                element: (
                  <Suspense fallback={<SuspenseFallback />}>
                    <ClientsPage />
                  </Suspense>
                ),
              },
              {
                path: 'coach/clients/:clientId',
                element: (
                  <Suspense fallback={<SuspenseFallback />}>
                    <ClientProfilePage />
                  </Suspense>
                ),
              },
              {
                path: 'coach/plans',
                element: <Navigate to="/plans" replace />,
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
