import type { Tip } from '../types'

/**
 * Curated tip catalog. Display text lives in i18n
 * (`translations.tips.entries.<id>.title|body`) so the same row works in
 * both English and Vietnamese.
 */
export const TIPS: readonly Tip[] = [
  {
    id: 'rpe-basics',
    category: 'training',
    audience: 'all',
    icon: 'Gauge',
    placements: ['day-workout', 'exercise-library'],
  },
  {
    id: 'progressive-overload',
    category: 'training',
    audience: 'all',
    icon: 'TrendingUp',
    placements: ['plans', 'plan-detail'],
  },
  {
    id: 'deload-weeks',
    category: 'training',
    audience: 'all',
    icon: 'Activity',
    placements: ['progress', 'week-detail'],
  },
  {
    id: 'warm-up-sets',
    category: 'training',
    audience: 'all',
    icon: 'Zap',
    placements: ['day-workout'],
  },
  {
    id: 'e1rm-explained',
    category: 'powerlifting',
    audience: 'all',
    icon: 'LineChart',
    placements: ['progress'],
  },
  {
    id: 'training-max',
    category: 'powerlifting',
    audience: 'all',
    icon: 'Target',
    placements: ['plan-detail', 'week-detail'],
  },
  {
    id: 'big3-cues',
    category: 'powerlifting',
    audience: 'all',
    icon: 'Dumbbell',
    placements: ['exercise-library'],
  },
  {
    id: 'plate-calculator',
    category: 'app',
    audience: 'all',
    icon: 'Calculator',
    placements: ['dashboard'],
  },
  {
    id: 'log-mid-set',
    category: 'app',
    audience: 'individual',
    icon: 'BookOpen',
    placements: ['day-workout'],
  },
  {
    id: 'client-compliance',
    category: 'app',
    audience: 'coach',
    icon: 'Users',
    placements: ['clients', 'coach-plans'],
  },
  {
    id: 'bodyweight-consistency',
    category: 'app',
    audience: 'all',
    icon: 'TrendingUp',
    placements: ['profile'],
  },
  {
    id: 'connecting-coach',
    category: 'app',
    audience: 'individual',
    icon: 'Users',
    placements: ['coaches'],
  },
]
