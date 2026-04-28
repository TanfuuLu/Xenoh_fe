export const ENDPOINTS = {
  // Auth
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refreshToken: '/api/auth/refresh-token',
    logout: '/api/auth/logout',
  },

  // Users
  users: {
    me: '/api/users/me',
    bodyweight: '/api/users/me/bodyweight',
    bodyweightById: (id: string) => `/api/users/me/bodyweight/${id}`,
    profile: (userId: string) => `/api/users/${userId}`,
  },

  // Coaches
  coaches: {
    list: '/api/coaches',
    profile: (coachId: string) => `/api/coaches/${coachId}`,
  },

  // Coach-Client
  coachClient: {
    request: '/api/coach-client/request',
    accept: (id: string) => `/api/coach-client/accept/${id}`,
    terminate: (id: string) => `/api/coach-client/${id}`,
    pendingRequests: '/api/coach-client/pending-requests',
    myCoach: '/api/coach-client/my-coach',
    myClients: '/api/coach-client/my-clients',
  },

  // Plans
  plans: {
    list: '/api/plans',
    byId: (id: string) => `/api/plans/${id}`,
    create: '/api/plans',
    update: (id: string) => `/api/plans/${id}`,
    delete: (id: string) => `/api/plans/${id}`,
    activate: (id: string) => `/api/plans/${id}/activate`,
    deactivate: (id: string) => `/api/plans/${id}/deactivate`,
    coachOverview: '/api/plans/coach-overview',
    forUser: '/api/plans/for-user',
  },

  // Weekly Workouts
  weeks: {
    byPlan: (planId: string) => `/api/plans/${planId}/weeks`,
    update: (planId: string, weekId: string) => `/api/plans/${planId}/weeks/${weekId}`,
  },

  // Daily Workouts
  days: {
    byWeek: (weeklyWorkoutId: string) => `/api/weeks/${weeklyWorkoutId}/days`,
    copy: (sourceDailyWorkoutId: string) => `/api/days/${sourceDailyWorkoutId}/copy`,
  },

  // Exercises
  exercises: {
    byDay: (dailyWorkoutId: string) => `/api/exercises/by-day/${dailyWorkoutId}`,
    create: '/api/exercises',
    update: (id: string) => `/api/exercises/${id}`,
    delete: (id: string) => `/api/exercises/${id}`,
    completeSet: (setId: string) => `/api/exercises/sets/${setId}/complete`,
    reorderByDay: (dailyWorkoutId: string) => `/api/exercises/by-day/${dailyWorkoutId}/reorder`,
  },

  // Exercise Templates
  exerciseTemplates: {
    list: '/api/exercise-templates',
  },

  // Leaderboard
  leaderboard: {
    big3: '/api/leaderboard/big3',
  },
} as const
