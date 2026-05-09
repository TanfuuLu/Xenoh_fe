export type TipCategory = 'training' | 'powerlifting' | 'app'

export type TipAudience = 'all' | 'individual' | 'coach'

/** Surfaces that may render a contextual InlineTip. */
export type TipPlacement =
  | 'dashboard'
  | 'day-workout'
  | 'progress'
  | 'plans'
  | 'plan-detail'
  | 'week-detail'
  | 'profile'
  | 'coaches'
  | 'clients'
  | 'coach-plans'
  | 'exercise-library'

/**
 * Tip metadata. Visible content (title + body) is looked up via i18n
 * (`translations.tips.entries.<id>.title|body`) so the same tip is shown
 * in the user's language without duplicating the data array.
 */
export interface Tip {
  id: string
  category: TipCategory
  audience: TipAudience
  /** lucide-react icon name. Resolved at render time. */
  icon: TipIconName
  /** Optional pages where this tip may also appear inline. */
  placements?: TipPlacement[]
}

export type TipIconName =
  | 'Activity'
  | 'BookOpen'
  | 'Calculator'
  | 'Dumbbell'
  | 'Gauge'
  | 'Lightbulb'
  | 'LineChart'
  | 'Target'
  | 'TrendingUp'
  | 'Users'
  | 'Zap'
