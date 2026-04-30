import { useEffect, useRef, useState } from 'react'
import { addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, format, isToday, isSameDay } from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// Range of selectable years — 100 years back, 10 years forward
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 111 }, (_, i) => CURRENT_YEAR - 100 + i)

interface Props {
  label?: string
  value?: string        // yyyy-MM-dd
  onChange?: (value: string) => void
  error?: string
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({ label, value, onChange, error, placeholder = 'Select date', disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'day' | 'year'>('day')
  const [viewDate, setViewDate] = useState<Date>(() => (value ? new Date(value + 'T00:00:00') : new Date()))
  const containerRef = useRef<HTMLDivElement>(null)
  const yearListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setViewDate(new Date(value + 'T00:00:00'))
  }, [value])

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setMode('day')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  // Scroll the selected year into view when year picker opens
  useEffect(() => {
    if (mode === 'year' && yearListRef.current) {
      const selectedEl = yearListRef.current.querySelector('[data-selected="true"]')
      selectedEl?.scrollIntoView({ block: 'center' })
    }
  }, [mode])

  const selectedDate = value ? new Date(value + 'T00:00:00') : null
  const displayValue = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''

  const firstDay = startOfMonth(viewDate)
  const daysInMonth = getDaysInMonth(viewDate)
  const startOffset = (getDay(firstDay) + 6) % 7

  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function selectDay(day: number) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    onChange?.(format(date, 'yyyy-MM-dd'))
    setOpen(false)
    setMode('day')
  }

  function selectYear(year: number) {
    setViewDate((d) => new Date(year, d.getMonth(), 1))
    setMode('day')
  }

  function toggleYearMode() {
    setMode((m) => (m === 'year' ? 'day' : 'year'))
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) { setOpen((o) => !o); setMode('day') } }}
          className={cn('xn-input w-full text-left', error && 'error')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: displayValue ? 'var(--fg-1)' : 'var(--fg-3)' }}
        >
          <span>{displayValue || placeholder}</span>
          <Calendar size={15} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full z-50 mt-1.5 rounded-2xl border shadow-xl"
            style={{ background: 'var(--bg-2)', borderColor: 'var(--border-1)', minWidth: 272 }}
          >
            {/* Header — always visible */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              {mode === 'day' && (
                <button
                  type="button"
                  onClick={() => setViewDate((d) => subMonths(d, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-70"
                  style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
                >
                  <ChevronLeft size={14} />
                </button>
              )}

              <button
                type="button"
                onClick={toggleYearMode}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold transition',
                  mode === 'day' ? 'text-text hover:opacity-70' : 'text-text',
                )}
                style={mode === 'year' ? { background: 'var(--bg-3)', flex: 1, justifyContent: 'center' } : { flex: 1, textAlign: 'center' }}
              >
                {mode === 'day'
                  ? format(viewDate, 'MMMM yyyy')
                  : `Pick a year`}
                <ChevronRight
                  size={13}
                  className="transition-transform"
                  style={{
                    transform: mode === 'year' ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: 'var(--fg-3)',
                  }}
                />
              </button>

              {mode === 'day' && (
                <button
                  type="button"
                  onClick={() => setViewDate((d) => addMonths(d, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-70"
                  style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            {/* Year picker */}
            {mode === 'year' && (
              <div
                ref={yearListRef}
                className="overflow-y-auto px-3 pb-3"
                style={{ maxHeight: 240 }}
              >
                <div className="grid grid-cols-3 gap-1.5">
                  {YEARS.map((year) => {
                    const isCurrentYear = year === viewDate.getFullYear()
                    const isThisYear = year === CURRENT_YEAR
                    return (
                      <button
                        key={year}
                        type="button"
                        data-selected={isCurrentYear}
                        onClick={() => selectYear(year)}
                        className="rounded-lg py-1.5 text-sm font-medium transition-colors"
                        style={
                          isCurrentYear
                            ? { background: 'var(--xn-clay-700)', color: '#fff' }
                            : isThisYear
                            ? { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' }
                            : { color: 'var(--fg-1)' }
                        }
                        onMouseEnter={(e) => {
                          if (!isCurrentYear) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
                        }}
                        onMouseLeave={(e) => {
                          if (isCurrentYear) (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-700)'
                          else if (isThisYear) (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-200)'
                          else (e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        {year}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Day view */}
            {mode === 'day' && (
              <div className="px-3 pb-3">
                {/* Day headers */}
                <div className="mb-1.5 grid grid-cols-7 text-center">
                  {DAY_HEADERS.map((d) => (
                    <span key={d} className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-3)' }}>
                      {d}
                    </span>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-y-0.5">
                  {cells.map((day, i) => {
                    if (day === null) return <div key={i} />
                    const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
                    const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false
                    const isTodayCell = isToday(cellDate)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectDay(day)}
                        className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors"
                        style={
                          isSelected
                            ? { background: 'var(--xn-clay-700)', color: '#fff' }
                            : isTodayCell
                            ? { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' }
                            : { color: 'var(--fg-1)' }
                        }
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
                        }}
                        onMouseLeave={(e) => {
                          if (isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-700)'
                          else if (isTodayCell) (e.currentTarget as HTMLElement).style.background = 'var(--xn-clay-200)'
                          else (e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs" style={{ color: 'var(--xn-danger)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
