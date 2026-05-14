import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import {
  startOfMonth,
  addMonths,
  differenceInCalendarDays,
  format,
  endOfMonth,
  isBefore,
  isAfter,
} from 'date-fns'
import { slideUp } from '@/shared/utils/motion'
import type { ClientResponse, CoachRelationshipResponse } from '../types'

const MONTHS = 6
const NAME_W = 88

const BAR_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6',
  '#f97316', '#06b6d4', '#8b5cf6', '#e11d48', '#84cc16',
]

interface Props {
  clients: ClientResponse[]
  pendingRequests: CoachRelationshipResponse[]
  maxClients: number
}

function parseYMD(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function CoachScheduleCalendar({ clients, pendingRequests, maxClients }: Props) {
  const shouldReduce = useReducedMotion()
  const today = new Date()
  const [windowStart, setWindowStart] = useState(() => startOfMonth(addMonths(today, -1)))

  const windowEnd = addMonths(windowStart, MONTHS)
  const totalWindowDays = differenceInCalendarDays(windowEnd, windowStart)
  const months = Array.from({ length: MONTHS }, (_, i) => addMonths(windowStart, i))

  const isUnlimited = maxClients > 999

  function toPercent(date: Date): number {
    return Math.max(0, Math.min(100, (differenceInCalendarDays(date, windowStart) / totalWindowDays) * 100))
  }

  function barBounds(startStr: string, endStr: string | null): { leftPct: number; widthPct: number } | null {
    const start = parseYMD(startStr)
    const end = endStr ? parseYMD(endStr) : windowEnd

    if (!isBefore(start, windowEnd) || isBefore(end, windowStart)) return null

    const clampedStart = isBefore(start, windowStart) ? windowStart : start
    const clampedEnd = isAfter(end, windowEnd) ? windowEnd : end
    const leftPct = toPercent(clampedStart)
    const rightPct = toPercent(clampedEnd)
    return { leftPct, widthPct: Math.max(0.5, rightPct - leftPct) }
  }

  function countForMonth(monthDate: Date): number {
    const mStart = startOfMonth(monthDate)
    const mEnd = endOfMonth(monthDate)
    return clients.filter((c) => {
      const start = parseYMD(c.startDate)
      const end = c.endDate ? parseYMD(c.endDate) : new Date(9999, 0, 1)
      return !isAfter(start, mEnd) && !isBefore(end, mStart)
    }).length
  }

  const todayPct = toPercent(today)
  const showTodayMarker = todayPct > 0 && todayPct < 100

  const animProps = shouldReduce ? {} : slideUp

  return (
    <motion.div
      {...animProps}
      className="overflow-hidden rounded-2xl"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-1)' }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={15} style={{ color: '#8b5cf6' }} />
          <span className="text-sm font-semibold text-text">Schedule</span>
          <span className="text-xs text-muted">
            {format(windowStart, 'MMM yyyy')} – {format(addMonths(windowStart, MONTHS - 1), 'MMM yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWindowStart((s) => addMonths(s, -1))}
            className="rounded p-1 text-muted transition hover:bg-surface hover:text-text"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setWindowStart(startOfMonth(addMonths(today, -1)))}
            className="rounded px-2 py-0.5 text-xs text-muted transition hover:bg-surface hover:text-text"
          >
            Today
          </button>
          <button
            onClick={() => setWindowStart((s) => addMonths(s, 1))}
            className="rounded p-1 text-muted transition hover:bg-surface hover:text-text"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Month header */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border-1)' }}>
        <div style={{ width: NAME_W, flexShrink: 0 }} />
        {months.map((m, i) => (
          <div
            key={i}
            className="flex-1 py-1.5 text-center text-xs font-medium text-muted"
            style={{ borderLeft: '1px solid var(--border-1)' }}
          >
            {format(m, 'MMM')}
            {m.getFullYear() !== today.getFullYear() && (
              <span className="ml-0.5 text-[10px]">{m.getFullYear()}</span>
            )}
          </div>
        ))}
      </div>

      {/* Rows */}
      {clients.length === 0 && pendingRequests.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted">No clients in this period</div>
      ) : (
        <>
          {clients.map((client, idx) => {
            const bar = barBounds(client.startDate, client.endDate)
            const color = BAR_COLORS[idx % BAR_COLORS.length]

            return (
              <div
                key={client.relationshipId}
                className="flex items-center"
                style={{ height: 36, borderBottom: '1px solid var(--border-1)' }}
              >
                <div
                  className="truncate px-3 text-xs font-medium text-text"
                  style={{ width: NAME_W, flexShrink: 0 }}
                  title={client.fullName}
                >
                  {client.fullName.split(' ')[0]}
                </div>
                <div className="relative flex-1" style={{ height: '100%' }}>
                  {months.map((_, i) =>
                    i > 0 ? (
                      <div
                        key={i}
                        className="pointer-events-none absolute top-0 bottom-0 w-px"
                        style={{ left: `${(i / MONTHS) * 100}%`, background: 'var(--border-1)' }}
                      />
                    ) : null,
                  )}
                  {showTodayMarker && (
                    <div
                      className="pointer-events-none absolute top-0 bottom-0 z-10 w-px"
                      style={{ left: `${todayPct}%`, background: 'rgba(239,68,68,0.55)' }}
                    />
                  )}
                  {bar && (
                    <div
                      className="absolute rounded"
                      title={`${client.fullName}: ${client.startDate} → ${client.endDate ?? '∞'}`}
                      style={{
                        left: `${bar.leftPct}%`,
                        width: `${bar.widthPct}%`,
                        top: '25%',
                        height: '50%',
                        background: `${color}bb`,
                        border: `1px solid ${color}`,
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}

          {pendingRequests.map((req) => {
            const bar = barBounds(req.startDate, req.endDate)

            return (
              <div
                key={req.id}
                className="flex items-center"
                style={{ height: 36, borderBottom: '1px solid var(--border-1)' }}
              >
                <div
                  className="truncate px-3 text-xs italic text-muted"
                  style={{ width: NAME_W, flexShrink: 0 }}
                  title={req.clientName}
                >
                  {req.clientName.split(' ')[0]}
                </div>
                <div className="relative flex-1" style={{ height: '100%' }}>
                  {months.map((_, i) =>
                    i > 0 ? (
                      <div
                        key={i}
                        className="pointer-events-none absolute top-0 bottom-0 w-px"
                        style={{ left: `${(i / MONTHS) * 100}%`, background: 'var(--border-1)' }}
                      />
                    ) : null,
                  )}
                  {showTodayMarker && (
                    <div
                      className="pointer-events-none absolute top-0 bottom-0 z-10 w-px"
                      style={{ left: `${todayPct}%`, background: 'rgba(239,68,68,0.55)' }}
                    />
                  )}
                  {bar && (
                    <div
                      className="absolute rounded"
                      title={`${req.clientName} (pending): ${req.startDate} → ${req.endDate ?? '∞'}`}
                      style={{
                        left: `${bar.leftPct}%`,
                        width: `${bar.widthPct}%`,
                        top: '25%',
                        height: '50%',
                        background: 'rgba(148,163,184,0.1)',
                        border: '1px dashed rgba(148,163,184,0.5)',
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Capacity footer */}
      <div className="flex" style={{ borderTop: '1px solid var(--border-1)', background: 'var(--bg-3)' }}>
        <div
          className="flex items-center px-3 text-xs text-muted"
          style={{ width: NAME_W, flexShrink: 0 }}
        >
          Cap.
        </div>
        {months.map((m, i) => {
          const count = countForMonth(m)
          const isFull = !isUnlimited && count >= maxClients
          const pct = isUnlimited ? 0 : Math.min(100, (count / maxClients) * 100)

          return (
            <div
              key={i}
              className="flex-1 px-2 py-2"
              style={{ borderLeft: '1px solid var(--border-1)' }}
            >
              <div
                className="text-center text-xs font-semibold"
                style={{ color: isFull ? 'var(--color-danger)' : 'var(--color-text)' }}
              >
                {count}
                {!isUnlimited && `/${maxClients}`}
              </div>
              {!isUnlimited && (
                <div
                  className="mx-auto mt-1 h-1 max-w-[48px] overflow-hidden rounded-full"
                  style={{ background: 'var(--bg-2)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: isFull
                        ? 'var(--color-danger)'
                        : pct > 60
                          ? 'var(--color-warning)'
                          : 'var(--color-success)',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
