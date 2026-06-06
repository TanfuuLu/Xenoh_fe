import { useEffect } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import { format } from 'date-fns'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { useLangStore } from '@/shared/i18n'
import { useDailyWorkouts, useWeeklyWorkouts } from '../index'

function isoDay(value: string): string {
  return value.slice(0, 10)
}

/**
 * Coach-only resolver: given a client's active plan, finds the current week and
 * today's daily workout, then redirects into the standard DayWorkout page with
 * edit access. Falls back to the nearest week/first day when today is outside the
 * plan's range. Both the client card and the client profile link here.
 */
export function ClientTodayWorkoutPage() {
  const lang = useLangStore((s) => s.lang)
  const tx = pageText(lang)
  const { clientId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('planId') ?? ''

  const {
    data: weeks,
    isLoading: weeksLoading,
    hasNextPage: hasMoreWeeks,
    fetchNextPage: fetchMoreWeeks,
    isFetchingNextPage: loadingMoreWeeks,
  } = useWeeklyWorkouts(planId)

  // Pull every week page so a "today" that lands in a later week still resolves.
  useEffect(() => {
    if (hasMoreWeeks && !loadingMoreWeeks) void fetchMoreWeeks()
  }, [hasMoreWeeks, loadingMoreWeeks, fetchMoreWeeks])

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const orderedWeeks = [...(weeks ?? [])].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  )

  const targetWeek =
    orderedWeeks.find((w) => isoDay(w.startDate) <= todayStr && todayStr <= isoDay(w.endDate)) ??
    [...orderedWeeks].reverse().find((w) => isoDay(w.startDate) <= todayStr) ??
    orderedWeeks[0]

  const {
    data: days,
    isLoading: daysLoading,
  } = useDailyWorkouts(targetWeek?.id ?? '')

  const orderedDays = [...(days ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  const targetDay = orderedDays.find((d) => isoDay(d.date) === todayStr) ?? orderedDays[0]

  const stillLoading =
    weeksLoading || hasMoreWeeks || loadingMoreWeeks || (targetWeek != null && daysLoading)

  if (!planId) return <EmptyState clientId={clientId} message={tx.noPlan} />

  if (stillLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (targetWeek && targetDay) {
    return (
      <Navigate
        to={`/days/${targetDay.id}`}
        replace
        state={{ canEdit: true, canComplete: false, weeklyWorkoutId: targetWeek.id, planId }}
      />
    )
  }

  return <EmptyState clientId={clientId} message={tx.noDay} />
}

function EmptyState({ clientId, message }: { clientId: string; message: string }) {
  const lang = useLangStore((s) => s.lang)
  const tx = pageText(lang)
  return (
    <div className="space-y-4">
      <Link to={`/coach/clients/${clientId}`}>
        <Button variant="ghost" size="sm">
          <ChevronLeft size={16} /> {tx.back}
        </Button>
      </Link>
      <div className="rounded-xl border border-border bg-surface py-14 text-center text-muted">
        {message}
      </div>
    </div>
  )
}

function pageText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      noPlan: 'Client chưa có kế hoạch đang hoạt động.',
      noDay: 'Không tìm thấy buổi tập cho hôm nay trong kế hoạch này.',
      back: 'Quay lại client',
    }
    : {
      noPlan: 'This client has no active plan.',
      noDay: 'No workout day found for today in this plan.',
      back: 'Back to client',
    }
}
