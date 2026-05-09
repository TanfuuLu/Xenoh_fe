import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DotsOverTimePoint } from '../../types'

const TICK_STYLE = { fill: 'var(--fg-3)', fontSize: 11 }

const TOOLTIP_STYLE = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-1)',
  borderRadius: 8,
  fontSize: 12,
}

interface Props {
  points: DotsOverTimePoint[]
}

export function DotsOverTimeChart({ points }: Props) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" vertical={false} />
          <XAxis dataKey="weekStart" tick={TICK_STYLE} interval="preserveStartEnd" tickLine={false} axisLine={false} />
          <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} width={40} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: 'var(--fg-1)' }}
            itemStyle={{ color: 'var(--color-primary)' }}
            formatter={(value, name) => {
              if (name === 'dots') return [Number(value).toFixed(2), 'DOTS']
              if (name === 'bodyweightKg') return [`${Number(value).toFixed(1)} kg`, 'Bodyweight']
              return [value, name]
            }}
          />
          <Line
            type="monotone"
            dataKey="dots"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="dots"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
