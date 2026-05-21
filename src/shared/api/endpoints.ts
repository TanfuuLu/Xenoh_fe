export const ENDPOINTS = {
  // Auth
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refreshToken: '/api/auth/refresh-token',
    logout: '/api/auth/logout',
    changePassword: '/api/auth/change-password',
    forgotPasswordSendCode: '/api/auth/forgot-password/send-code',
    forgotPasswordReset: '/api/auth/forgot-password/reset',
    externalLogin: (provider: 'google' | 'facebook') => `/api/auth/external/${provider}`,
    externalExchange: '/api/auth/external/exchange',
    externalCompleteRegistration: '/api/auth/external/complete-registration',
  },

  // Users
  users: {
    me: '/api/users/me',
    avatar: '/api/users/me/avatar',
    bodyweight: '/api/users/me/bodyweight',
    bodyweightById: (id: string) => `/api/users/me/bodyweight/${id}`,
    exercisePrs: '/api/users/me/exercise-prs',
    exercisePrHistory: (exerciseTemplateId: string) =>
      `/api/users/me/exercise-prs/${exerciseTemplateId}/history`,
    profile: (userId: string) => `/api/users/${userId}`,
    publicProfile: (userId: string) => `/api/users/${userId}/public`,
    profileBodyweight: (userId: string) => `/api/users/${userId}/bodyweight`,
    report: (userId: string) => `/api/users/${userId}/reports`,
  },

  // Coaches
  coaches: {
    list: '/api/coaches',
    profile: (coachId: string) => `/api/coaches/${coachId}`,
    rating: (coachId: string) => `/api/coaches/${coachId}/rating`,
  },

  // Coach-Client
  coachClient: {
    request: '/api/coach-client/request',
    accept: (id: string) => `/api/coach-client/accept/${id}`,
    terminate: (id: string) => `/api/coach-client/${id}`,
    requestTermination: (id: string) => `/api/coach-client/${id}/request-termination`,
    acceptTermination: (id: string) => `/api/coach-client/${id}/accept-termination`,
    rejectTermination: (id: string) => `/api/coach-client/${id}/reject-termination`,
    requestRenewal: (id: string) => `/api/coach-client/${id}/request-renewal`,
    acceptRenewal: (id: string) => `/api/coach-client/${id}/accept-renewal`,
    rejectRenewal: (id: string) => `/api/coach-client/${id}/reject-renewal`,
    pendingRequests: '/api/coach-client/pending-requests',
    myCoach: '/api/coach-client/my-coach',
    myClients: '/api/coach-client/my-clients',
    dashboard: '/api/coach-client/dashboard',
    clientPowerlifting: (clientId: string) => `/api/coach-client/clients/${clientId}/powerlifting`,
    aiBrief: (clientId: string, lang: 'en' | 'vi') =>
      `/api/coach-client/clients/${clientId}/ai-brief?lang=${lang}`,
    inviteCodes: '/api/coach-client/invite-codes',
    deleteInviteCode: (id: string) => `/api/coach-client/invite-codes/${id}`,
    connectByCode: '/api/coach-client/connect-by-code',
  },

  // Dashboard
  dashboard: {
    personal: '/api/dashboard/personal',
  },

  // Blocks
  blocks: {
    block: (userId: string) => `/api/users/${userId}/block`,
    unblock: (userId: string) => `/api/users/${userId}/block`,
    list: '/api/users/me/blocks',
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
    analytics: (id: string) => `/api/plans/${id}/analytics`,
    coachOverview: '/api/plans/coach-overview',
    forUser: '/api/plans/for-user',
    starterAi: '/api/plans/starter-ai',
    balanceCheck: (id: string, lang: 'en' | 'vi') => `/api/plans/${id}/balance-check?lang=${lang}`,
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
    markStatus: (dailyWorkoutId: string) => `/api/days/${dailyWorkoutId}/status`,
    aiGuidance: (dailyWorkoutId: string, lang: 'en' | 'vi') =>
      `/api/days/${dailyWorkoutId}/ai-guidance?lang=${lang}`,
  },

  // Exercises
  exercises: {
    byDay: (dailyWorkoutId: string) => `/api/exercises/by-day/${dailyWorkoutId}`,
    create: '/api/exercises',
    update: (id: string) => `/api/exercises/${id}`,
    delete: (id: string) => `/api/exercises/${id}`,
    completeSet: (setId: string) => `/api/exercises/sets/${setId}/complete`,
    startTimer: (id: string) => `/api/exercises/${id}/timer/start`,
    finishTimer: (id: string) => `/api/exercises/${id}/timer/finish`,
    setDuration: (id: string) => `/api/exercises/${id}/timer/set-duration`,
    reorderByDay: (dailyWorkoutId: string) => `/api/exercises/by-day/${dailyWorkoutId}/reorder`,
  },

  // Exercise Templates
  exerciseTemplates: {
    list: '/api/exercise-templates',
    forClient: (clientId: string) => `/api/exercise-templates/for-client/${clientId}`,
    custom: '/api/exercise-templates/custom',
    customById: (id: string) => `/api/exercise-templates/custom/${id}`,
    customForClient: (clientId: string) => `/api/exercise-templates/custom/for-client/${clientId}`,
    lastPerformance: (exerciseTemplateId: string, dailyWorkoutId: string) =>
      `/api/exercise-templates/${exerciseTemplateId}/last-performance?dailyWorkoutId=${dailyWorkoutId}`,
  },

  // Plan Comments
  planComments: {
    list: (planId: string) => `/api/plans/${planId}/comments`,
    create: (planId: string) => `/api/plans/${planId}/comments`,
    delete: (planId: string, commentId: string) => `/api/plans/${planId}/comments/${commentId}`,
  },

  // Week Comments
  weekComments: {
    list: (weekId: string) => `/api/weeks/${weekId}/comments`,
    create: (weekId: string) => `/api/weeks/${weekId}/comments`,
    delete: (weekId: string, commentId: string) => `/api/weeks/${weekId}/comments/${commentId}`,
  },

  // Subscriptions
  subscriptions: {
    me: '/api/subscriptions/me',
    createOrder: '/api/subscriptions/payment-orders',
  },

  // Nutrition
  nutrition: {
    summary: '/api/nutrition/summary',
    profile: '/api/nutrition/profile',
    log: (date: string) => `/api/nutrition/logs/${date}`,
    history: (from: string, to: string) => `/api/nutrition/history?from=${from}&to=${to}`,
    clientSummary: (clientId: string) => `/api/nutrition/clients/${clientId}/summary`,
    clientProfile: (clientId: string) => `/api/nutrition/clients/${clientId}/profile`,
    clientLog: (clientId: string, date: string) => `/api/nutrition/clients/${clientId}/logs/${date}`,
    clientHistory: (clientId: string, from: string, to: string) =>
      `/api/nutrition/clients/${clientId}/history?from=${from}&to=${to}`,
    // Food
    foodSearch: (q: string, lang = 'vi') => `/api/nutrition/foods/search?q=${encodeURIComponent(q)}&lang=${lang}`,
    foodResolve: (name: string) => `/api/nutrition/foods/resolve?name=${encodeURIComponent(name)}`,
    foodCreate: '/api/nutrition/foods',
    dayFoods: (date: string) => `/api/nutrition/logs/${date}/foods`,
    dayFoodCreate: (date: string) => `/api/nutrition/logs/${date}/foods`,
    dayFoodDelete: (date: string, id: string) => `/api/nutrition/logs/${date}/foods/${id}`,
  },

  // Insights (AI-generated user analysis)
  insights: {
    me: (lang: 'en' | 'vi') => `/api/insights/me?lang=${lang}`,
  },

  // Notifications
  notifications: {
    list: '/api/notifications',
    markRead: (id: string) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/read-all',
  },

  // Share (public, no auth)
  share: {
    prPage:  (userId: string, exerciseTemplateId: string) =>
      `/api/share/pr/${userId}/${exerciseTemplateId}`,
    prImage: (userId: string, exerciseTemplateId: string) =>
      `/api/share/pr/${userId}/${exerciseTemplateId}/image.png`,
  },

  // Admin
  admin: {
    dashboard: '/api/admin/dashboard',
    reports: '/api/admin/reports',
    reportsSummary: '/api/admin/reports/summary',
    report: (id: string) => `/api/admin/reports/${id}`,
    users: '/api/admin/users',
    user: (userId: string) => `/api/admin/users/${userId}`,
    suspendUser: (userId: string) => `/api/admin/users/${userId}/suspend`,
    unsuspendUser: (userId: string) => `/api/admin/users/${userId}/unsuspend`,
    plans: '/api/admin/plans',
    planAnalytics: (planId: string) => `/api/admin/plans/${planId}/analytics`,
    payments: '/api/admin/payments',
    paymentsSummary: '/api/admin/payments/summary',
    subscriptions: '/api/admin/subscriptions',
  },

  // Messages (Chat)
  messages: {
    byRelationship: (id: string) => `/api/messages/relationships/${id}`,
    markRead: (id: string) => `/api/messages/relationships/${id}/read`,
    unreadCounts: '/api/messages/unread-counts',
  },
} as const
