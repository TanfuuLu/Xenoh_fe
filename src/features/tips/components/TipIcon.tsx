import {
  Activity,
  BookOpen,
  Calculator,
  Dumbbell,
  Gauge,
  Lightbulb,
  LineChart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import type { TipIconName } from '../types'

/** Maps the typed icon names from `Tip.icon` to actual lucide components. */
const ICONS: Record<TipIconName, React.ComponentType<{ size?: number; className?: string }>> = {
  Activity,
  BookOpen,
  Calculator,
  Dumbbell,
  Gauge,
  Lightbulb,
  LineChart,
  Target,
  TrendingUp,
  Users,
  Zap,
}

interface Props {
  name: TipIconName
  size?: number
  className?: string
}

export function TipIcon({ name, size = 18, className }: Props) {
  const Icon = ICONS[name] ?? Lightbulb
  return <Icon size={size} className={className} />
}
