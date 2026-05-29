import { addDays, differenceInCalendarDays, format } from 'date-fns'
import type { PlanResponse } from '../types'

export function buildDuplicateDefaults(plan: PlanResponse) {
  const originalStart = parseDateOnly(plan.startDate)
  const originalEnd = parseDateOnly(plan.endDate)
  const durationOffset = Math.max(0, differenceInCalendarDays(originalEnd, originalStart))
  const startDate = addDays(originalEnd, 1)
  const endDate = addDays(startDate, durationOffset)

  return {
    name: `${plan.name.slice(0, 95)} Copy`,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  }
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}
