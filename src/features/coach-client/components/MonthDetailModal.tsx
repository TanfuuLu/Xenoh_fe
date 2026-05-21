import { createPortal } from 'react-dom'
import { useState } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths,
  getDay, format, isToday, isBefore, isAfter,
} from 'date-fns'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ClientResponse } from '../types'

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export interface ClientWithColor {
  client: ClientResponse
  color: string
}

interface Props {
  initialMonth: Date
  clientsWithColors: ClientWithColor[]
  onClose: () => void
}

function parseYMD(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getActiveClients(day: Date, clientsWithColors: ClientWithColor[]): ClientWithColor[] {
  return clientsWithColors.filter(({ client }) => {
    const start = parseYMD(client.startDate)
    const end = client.endDate ? parseYMD(client.endDate) : new Date(9999, 0, 1)
    return !isBefore(day, start) && !isAfter(day, end)
  })
}

export function MonthDetailModal({ initialMonth, clientsWithColors, onClose }: Props) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(initialMonth))

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  const startOffset = (getDay(days[0]) + 6) % 7
  const cells: (Date | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...days,
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const activeThisMonth = clientsWithColors.filter(({ client }) => {
    const start = parseYMD(client.startDate)
    const end = client.endDate ? parseYMD(client.endDate) : new Date(9999, 0, 1)
    const mStart = startOfMonth(viewMonth)
    const mEnd = endOfMonth(viewMonth)
    return !isAfter(start, mEnd) && !isBefore(end, mStart)
  })

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', zIndex: 9999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          width: '80vmin',
          height: '80vmin',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-2)',
          border: '2px solid var(--surface-border-soft)',
          boxShadow: 'var(--sh-md)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-1)' }}
        >
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-70"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
            >
              <ChevronLeft size={15} />
            </button>
            <div>
              <p className="text-base font-semibold" style={{ color: 'var(--fg-1)' }}>
                {format(viewMonth, 'MMMM yyyy')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
                {activeThisMonth.length === 0
                  ? 'No clients this month'
                  : `${activeThisMonth.length} client${activeThisMonth.length > 1 ? 's' : ''} scheduled`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-70"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Client legend */}
            {clientsWithColors.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {clientsWithColors.map(({ client, color }) => (
                  <div key={client.clientId} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--fg-2)' }}>
                      {client.fullName.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={onClose} style={{ color: 'var(--fg-3)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold uppercase tracking-wide py-1.5"
                style={{ color: 'var(--fg-3)' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid — grows to fill remaining height */}
          <div className="grid grid-cols-7 gap-1.5 flex-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="rounded-lg" />

              const active = getActiveClients(day, clientsWithColors)
              const todayCell = isToday(day)

              return (
                <div
                  key={i}
                  className="rounded-lg p-2 flex flex-col gap-1"
                  style={{
                    minHeight: 90,
                    background: todayCell ? 'var(--bg-3)' : 'var(--bg-1)',
                    border: todayCell
                      ? '1.5px solid var(--surface-border)'
                      : '1.5px solid var(--surface-border-soft)',
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: todayCell ? 'var(--xn-clay-800)' : 'var(--fg-2)' }}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {active.map(({ client, color }) => (
                      <div
                        key={client.clientId}
                        className="truncate rounded px-1.5 text-[10px] font-semibold leading-[18px]"
                        style={{
                          background: `${color}22`,
                          color,
                          borderLeft: `2px solid ${color}`,
                        }}
                        title={client.fullName}
                      >
                        {client.fullName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
