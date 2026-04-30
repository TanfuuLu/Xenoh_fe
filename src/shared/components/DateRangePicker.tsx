import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  addMonths, subMonths, getDaysInMonth, startOfMonth,
  getDay, format, isToday, isSameDay, isAfter, isBefore, parseISO,
} from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface Props {
  startValue?: string
  endValue?: string
  onStartChange?: (val: string) => void
  onEndChange?: (val: string) => void
  startLabel?: string
  endLabel?: string
  startError?: string
  endError?: string
}

export function DateRangePicker({
  startValue, endValue,
  onStartChange, onEndChange,
  startLabel = 'Start date', endLabel = 'End date',
  startError, endError,
}: Props) {
  const [open, setOpen] = useState(false)
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')
  const [viewDate, setViewDate] = useState<Date>(() => (startValue ? parseISO(startValue) : new Date()))
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [slideDir, setSlideDir] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const startDate = startValue ? parseISO(startValue) : null
  const endDate = endValue ? parseISO(endValue) : null

  useEffect(() => {
    if (!open) { setHoverDate(null); return }
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function openFor(which: 'start' | 'end') {
    setSelecting(which)
    if (which === 'start' && startDate) setViewDate(startDate)
    else if (which === 'end' && (endDate ?? startDate)) setViewDate((endDate ?? startDate)!)
    setOpen(true)
  }

  function prevMonth() { setSlideDir(-1); setViewDate((d) => subMonths(d, 1)) }
  function nextMonth() { setSlideDir(1); setViewDate((d) => addMonths(d, 1)) }

  function pickDay(date: Date) {
    const val = format(date, 'yyyy-MM-dd')
    if (selecting === 'start') {
      onStartChange?.(val)
      if (endDate && !isBefore(date, endDate)) onEndChange?.('')
      setSelecting('end')
    } else {
      if (startDate && isBefore(date, startDate)) {
        onStartChange?.(val)
        onEndChange?.(format(startDate, 'yyyy-MM-dd'))
      } else {
        onEndChange?.(val)
        setOpen(false)
      }
    }
  }

  // Effective end for hover preview
  const previewEnd = selecting === 'end' && !endDate && hoverDate ? hoverDate : endDate

  function getDayMeta(day: number) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    const isStart = !!startDate && isSameDay(date, startDate)
    const isEnd = !!endDate && isSameDay(date, endDate)
    const isHover = selecting === 'end' && !endDate && !!hoverDate && isSameDay(date, hoverDate)
    const inRange = !!(startDate && previewEnd && isAfter(date, startDate) && isBefore(date, previewEnd))
    const isEdge = isStart || isEnd || isHover
    const isSingleDay = !!startDate && !!endDate && isSameDay(startDate, endDate)
    // Strip extends from start rightward and to end leftward
    const hasStripLeft = (isEnd || isHover || inRange) && !isSingleDay && !!startDate
    const hasStripRight = (isStart || inRange) && !isSingleDay && !!(endDate || (selecting === 'end' && hoverDate))
    return { date, isStart, isEnd, isHover, inRange, isEdge, hasStripLeft, hasStripRight }
  }

  // Build calendar grid
  const firstDay = startOfMonth(viewDate)
  const daysInMonth = getDaysInMonth(viewDate)
  const offset = (getDay(firstDay) + 6) % 7
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const displayStart = startDate ? format(startDate, 'dd/MM/yyyy') : ''
  const displayEnd = endDate ? format(endDate, 'dd/MM/yyyy') : ''

  return (
    <div ref={containerRef}>
      {/* Trigger inputs */}
      <div className="grid grid-cols-2 gap-3">
        {(['start', 'end'] as const).map((which) => {
          const isStart = which === 'start'
          const display = isStart ? displayStart : displayEnd
          const label = isStart ? startLabel : endLabel
          const err = isStart ? startError : endError
          const active = open && selecting === which
          return (
            <div key={which} className="flex flex-col gap-1.5">
              {label && (
                <label className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
                  {label}
                </label>
              )}
              <button
                type="button"
                onClick={() => openFor(which)}
                className={cn('xn-input w-full text-left', err && 'error')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: display ? 'var(--fg-1)' : 'var(--fg-3)',
                  outline: active ? '2px solid var(--xn-clay-400)' : undefined,
                  outlineOffset: active ? '2px' : undefined,
                }}
              >
                <span>{display || (isStart ? 'dd/mm/yyyy' : 'dd/mm/yyyy')}</span>
                <Calendar size={15} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
              </button>
              {err && <span className="text-xs" style={{ color: 'var(--xn-danger)' }}>{err}</span>}
            </div>
          )
        })}
      </div>

      {/* Calendar popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 overflow-hidden rounded-2xl border shadow-2xl"
            style={{ background: 'var(--bg-2)', borderColor: 'var(--xn-clay-300)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: 'var(--xn-clay-100)', borderBottom: '1px solid var(--xn-clay-200)' }}
            >
              <div className="flex gap-3">
                <StepTab active={selecting === 'start'} onClick={() => setSelecting('start')}>
                  <span className="text-xs uppercase tracking-wide">Start</span>
                  <span className="text-sm font-bold">{displayStart || '—'}</span>
                </StepTab>
                <div className="my-1 w-px" style={{ background: 'var(--xn-clay-300)' }} />
                <StepTab active={selecting === 'end'} onClick={() => { if (startDate) setSelecting('end') }}>
                  <span className="text-xs uppercase tracking-wide">End</span>
                  <span className="text-sm font-bold">{displayEnd || '—'}</span>
                </StepTab>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition hover:opacity-60"
                style={{ color: 'var(--xn-clay-700)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              {/* Month nav */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
                  style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={format(viewDate, 'yyyy-MM')}
                      initial={{ opacity: 0, x: slideDir * 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -slideDir * 30 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="text-sm font-bold text-text"
                    >
                      {format(viewDate, 'MMMM yyyy')}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
                  style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day headers */}
              <div className="mb-1 grid grid-cols-7 text-center">
                {DAY_HEADERS.map((d) => (
                  <span key={d} className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                    {d}
                  </span>
                ))}
              </div>

              {/* Day grid — animate when month changes */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={format(viewDate, 'yyyy-MM')}
                  initial={{ opacity: 0, x: slideDir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -slideDir * 40 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="grid grid-cols-7"
                  onMouseLeave={() => setHoverDate(null)}
                >
                  {cells.map((day, i) => {
                    if (day === null) return <div key={i} className="h-10" />
                    const { date, isStart, isEnd, isHover, inRange, isEdge, hasStripLeft, hasStripRight } = getDayMeta(day)
                    const todayCell = isToday(date)
                    const isSelected = isStart || isEnd || isHover

                    return (
                      <div
                        key={i}
                        className="relative flex h-10 items-center justify-center"
                        onMouseEnter={() => setHoverDate(date)}
                      >
                        {/* Left strip half */}
                        {hasStripLeft && (
                          <div
                            className="absolute bottom-1 left-0 top-1 w-1/2"
                            style={{ background: 'var(--xn-clay-100)' }}
                          />
                        )}
                        {/* Right strip half */}
                        {hasStripRight && (
                          <div
                            className="absolute bottom-1 right-0 top-1 w-1/2"
                            style={{ background: 'var(--xn-clay-100)' }}
                          />
                        )}
                        {/* Middle strip for in-range */}
                        {inRange && !isEdge && (
                          <div
                            className="absolute bottom-1 left-0 right-0 top-1"
                            style={{ background: 'var(--xn-clay-100)' }}
                          />
                        )}

                        {/* Day button */}
                        <motion.button
                          type="button"
                          onClick={() => pickDay(date)}
                          whileTap={{ scale: 0.9 }}
                          className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
                          style={
                            isSelected
                              ? { background: 'var(--xn-clay-700)', color: '#fff', fontWeight: 700 }
                              : todayCell
                              ? { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)', fontWeight: 600 }
                              : inRange
                              ? { color: 'var(--xn-clay-800)' }
                              : { color: 'var(--fg-1)' }
                          }
                          onMouseEnter={(e) => {
                            if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-200)'
                          }}
                          onMouseLeave={(e) => {
                            if (isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-700)'
                            else if (todayCell) (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-200)'
                            else (e.currentTarget as HTMLElement).style.background = 'transparent'
                          }}
                        >
                          {day}
                        </motion.button>
                      </div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StepTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-0.5 rounded-lg px-2 py-1 transition"
      style={{
        color: active ? 'var(--xn-clay-800)' : 'var(--xn-clay-500)',
        background: active ? 'var(--xn-clay-200)' : 'transparent',
      }}
    >
      {children}
    </button>
  )
}
