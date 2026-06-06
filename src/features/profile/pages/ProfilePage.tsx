import { useRef, useState, type ChangeEvent, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, Camera, ChevronLeft, ChevronRight, Clock3, Dumbbell } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { DatePicker } from '@/shared/components/DatePicker'
import { Modal } from '@/shared/components/Modal'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { cn } from '@/shared/utils/cn'
import { useT } from '@/shared/i18n'
import { LevelCard } from '@/features/dashboard/components/LevelCard'
import { InlineTip } from '@/features/tips'
import {
  DevelopmentDirection,
  TrainingDiscipline,
  type DevelopmentDirection as DevelopmentDirectionValue,
  type Gender,
  type TrainingDiscipline as TrainingDisciplineValue,
} from '@/shared/types/api'
import {
  useMyProfile,
  useMyTrainingActivity,
  useUpdateAvatar,
  useUpdateProfile,
} from '../index'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

type ProfileForm = {
  firstName: string
  lastName: string
  bio?: string
  height?: number
  gender?: Gender
  dateOfBirth?: string
  developmentDirection?: DevelopmentDirectionValue
  trainingDiscipline?: TrainingDisciplineValue
  facebookUrl?: string
  instagramUrl?: string
  zaloUrl?: string
}

function formatDisplayDate(value: string | null | undefined, pattern = 'dd/MM/yyyy') {
  if (!value) return '—'
  const date = new Date(value)
  return isValid(date) ? format(date, pattern) : '—'
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return undefined
  const date = new Date(value)
  return isValid(date) ? format(date, 'yyyy-MM-dd') : undefined
}

function getInitialCalendarMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function shiftCalendarMonth(value: { year: number; month: number }, offset: number) {
  const date = new Date(value.year, value.month - 1 + offset, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

function formatTrainingDuration(seconds: number | null | undefined) {
  const totalSeconds = Math.max(0, Math.floor(seconds ?? 0))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`
}

function formatTrainingWeightKg(weightKg: number | null | undefined) {
  const totalKg = Math.max(0, Math.round(Number(weightKg ?? 0)))
  return `${totalKg.toLocaleString()} kg`
}

function formatProfileOption<T extends string>(
  value: T | null | undefined,
  labels: Record<T, string>,
) {
  return value ? labels[value] ?? value : '—'
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function ProfilePage() {
  const [editMode, setEditMode] = useState(false)
  const [activityMonth, setActivityMonth] = useState(getInitialCalendarMonth)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { data: profile, isLoading } = useMyProfile()
  const { data: trainingActivity, isLoading: activityLoading } =
    useMyTrainingActivity(activityMonth.year, activityMonth.month)
  const { mutate: updateProfile, isPending: saving, error: saveError } = useUpdateProfile()
  const { mutate: updateAvatar, isPending: avatarUploading } = useUpdateAvatar()
  const t  = useT()
  const tp = t.profile
  const tc = t.common

  // Build schemas inside component for translated error messages
  const profileSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    bio: z.string().max(500, tp.bioMaxError).optional(),
    height: z.coerce.number().min(50).max(300).optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    dateOfBirth: z.string().optional(),
    developmentDirection: z.enum(DevelopmentDirection).optional(),
    trainingDiscipline: z.enum(TrainingDiscipline).optional(),
    facebookUrl:  z.string().url('Invalid URL').or(z.literal('')).optional(),
    instagramUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
    zaloUrl:      z.string().url('Invalid URL').or(z.literal('')).optional(),
  })

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    control: profileControl,
    formState: { errors: profileErrors },
  } = useForm<z.input<typeof profileSchema>, unknown, ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      bio: profile?.bio ?? '',
      height: profile?.height ?? undefined,
      gender: profile?.gender ?? undefined,
      dateOfBirth: toDateInputValue(profile?.dateOfBirth),
      developmentDirection: profile?.developmentDirection ?? undefined,
      trainingDiscipline: profile?.trainingDiscipline ?? undefined,
      facebookUrl:  profile?.facebookUrl ?? '',
      instagramUrl: profile?.instagramUrl ?? '',
      zaloUrl:      profile?.zaloUrl ?? '',
    },
  })

  function onSaveProfile(data: ProfileForm) {
    updateProfile({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      bio: data.bio?.trim() ?? '',
      height: data.height,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth || undefined,
      developmentDirection: data.developmentDirection,
      trainingDiscipline: data.trainingDiscipline,
      facebookUrl: data.facebookUrl?.trim() || undefined,
      instagramUrl: data.instagramUrl?.trim() || undefined,
      zaloUrl: data.zaloUrl?.trim() || undefined,
    }, { onSuccess: () => setEditMode(false) })
  }

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    updateAvatar(file, {
      onSettled: () => {
        event.target.value = ''
      },
    })
  }

  const apiError = (saveError as AxiosError<ApiError>)?.response?.data?.message

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-text">{tp.title}</h1>
        <InlineTip placement="profile" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {profile && <LevelCard profile={profile} variant="square" className="w-full" />}

        {/* Profile info */}
        <Card style={{ borderColor: 'var(--surface-border-soft)' }}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <UserAvatar
                name={`${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()}
                email={profile?.email}
                imageUrl={profile?.avatarUrl}
                size={56}
              />
              <button
                type="button"
                title="Upload avatar"
                aria-label="Upload avatar"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: 'var(--bg-2)',
                  borderColor: 'var(--border-1)',
                  color: 'var(--fg-1)',
                }}
              >
                <Camera size={14} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-text">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="truncate text-sm text-muted">{profile?.email}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => setEditMode(true)}>
            {tp.editBtn}
          </Button>
        </div>

        <Modal open={editMode} onClose={() => setEditMode(false)} title={tp.editBtn} className="profile-edit-modal max-w-2xl">
          <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Input
                label={(tp as typeof tp & { firstNameLabel?: string }).firstNameLabel ?? 'First name'}
                error={profileErrors.firstName?.message}
                {...regProfile('firstName')}
              />
              <Input
                label={(tp as typeof tp & { lastNameLabel?: string }).lastNameLabel ?? 'Last name'}
                error={profileErrors.lastName?.message}
                {...regProfile('lastName')}
              />
            </div>
            <Textarea
              label={tp.bioLabel}
              rows={4}
              maxLength={500}
              error={profileErrors.bio?.message}
              {...regProfile('bio')}
            />
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Input
                label={tp.heightLabel}
                type="number"
                step="0.1"
                error={profileErrors.height?.message}
                {...regProfile('height', { setValueAs: (value) => value === '' ? undefined : value })}
              />
              <Controller
                name="gender"
                control={profileControl}
                render={({ field }) => (
                  <Select
                    label={tp.genderLabel}
                    options={[
                      { value: 'Male', label: tp.male },
                      { value: 'Female', label: tp.female },
                      { value: 'Other', label: tp.other },
                    ]}
                    placeholder={tc.selectPlaceholder}
                    value={field.value ?? ''}
                    onChange={(value) => field.onChange(value || undefined)}
                  />
                )}
              />
            </div>
            <Controller
              name="dateOfBirth"
              control={profileControl}
              render={({ field }) => (
                <DatePicker
                  label={tp.dobLabel}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val || undefined)}
                />
              )}
            />
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Controller
                name="developmentDirection"
                control={profileControl}
                render={({ field }) => (
                  <Select
                    label={tp.developmentDirectionLabel}
                    options={DevelopmentDirection.map((value) => ({
                      value,
                      label: tp.developmentDirections[value],
                    }))}
                    placeholder={tc.selectPlaceholder}
                    value={field.value ?? ''}
                    onChange={(value) => field.onChange(value || undefined)}
                  />
                )}
              />
              <Controller
                name="trainingDiscipline"
                control={profileControl}
                render={({ field }) => (
                  <Select
                    label={tp.trainingDisciplineLabel}
                    options={TrainingDiscipline.map((value) => ({
                      value,
                      label: tp.trainingDisciplines[value],
                    }))}
                    placeholder={tc.selectPlaceholder}
                    value={field.value ?? ''}
                    onChange={(value) => field.onChange(value || undefined)}
                  />
                )}
              />
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Social links</p>
              <Input
                label="Facebook"
                placeholder="https://facebook.com/yourprofile"
                error={profileErrors.facebookUrl?.message}
                {...regProfile('facebookUrl')}
              />
              <Input
                label="Instagram"
                placeholder="https://instagram.com/yourprofile"
                error={profileErrors.instagramUrl?.message}
                {...regProfile('instagramUrl')}
              />
              <Input
                label="Zalo"
                placeholder="https://zalo.me/yourphone"
                error={profileErrors.zaloUrl?.message}
                {...regProfile('zaloUrl')}
              />
            </div>
            {apiError && <p className="text-sm text-danger">{apiError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => setEditMode(false)}>
                {tp.cancelBtn}
              </Button>
              <Button type="submit" className="w-full sm:w-auto" loading={saving}>{tp.saveBtn}</Button>
            </div>
          </form>
        </Modal>

          <div className="grid gap-4 min-[390px]:grid-cols-2 md:grid-cols-4">
            <div className="min-[390px]:col-span-2 md:col-span-4">
              <p className="text-xs text-muted">{tp.bioStat}</p>
              <p className="whitespace-pre-line text-sm font-medium text-text">
                {profile?.bio?.trim() ? profile.bio : tp.noBio}
              </p>
            </div>
            <Stat label={tp.heightStat} value={profile?.height ? `${profile.height} cm` : '—'} />
            <Stat label={tp.genderStat} value={profile?.gender === 'Male' ? tp.male : profile?.gender === 'Female' ? tp.female : profile?.gender === 'Other' ? tp.other : '—'} />
            <Stat label={tp.dobStat}    value={formatDisplayDate(profile?.dateOfBirth)} />
            <Stat label={tp.developmentDirectionStat} value={formatProfileOption(profile?.developmentDirection, tp.developmentDirections)} />
            <Stat label={tp.trainingDisciplineStat} value={formatProfileOption(profile?.trainingDiscipline, tp.trainingDisciplines)} />
            <Stat label={tp.bmiStat}    value={profile?.bmi ? `${profile.bmi.toFixed(1)} (${profile.bmiCategory})` : '—'} />
            <Stat label={tp.dotsStat}   value={profile?.dotsScore ? profile.dotsScore.toFixed(1) : '—'} />
            <Stat label={tp.streakStat} value={`${profile?.currentStreak ?? 0} ${tc.days}`} />
          </div>

        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="grid gap-3">
          <TrainingMetricCard
            icon={<Clock3 size={15} />}
            label={tp.totalTrainedTime}
            value={formatTrainingDuration(trainingActivity?.totalDurationSeconds)}
            loading={activityLoading}
          />
          <TrainingMetricCard
            icon={<Dumbbell size={15} />}
            label={tp.totalWeightTrained}
            value={formatTrainingWeightKg(trainingActivity?.totalWeightTrainedKg)}
            loading={activityLoading}
          />
        </div>
        <TrainingCalendar
          year={activityMonth.year}
          month={activityMonth.month}
          trainedDates={trainingActivity?.trainedDates ?? []}
          loading={activityLoading}
          labels={{
            title: tp.trainingCalendar,
            previous: tp.previousMonth,
            next: tp.nextMonth,
            empty: tp.noTrainingDays,
            weekdays: tp.weekdays,
          }}
          onPrevious={() => setActivityMonth((current) => shiftCalendarMonth(current, -1))}
          onNext={() => setActivityMonth((current) => shiftCalendarMonth(current, 1))}
        />
      </div>

    </div>
  )
}

function TrainingMetricCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: ReactNode
  label: string
  value: string
  loading: boolean
}) {
  return (
    <Card
      className="flex h-28 w-full flex-col justify-between"
      style={{ borderColor: 'var(--surface-border-soft)', boxShadow: 'none' }}
    >
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <p className="text-xs font-semibold uppercase">{label}</p>
      </div>
      {loading ? (
        <Spinner size="sm" />
      ) : (
        <p className="font-mono text-2xl font-semibold leading-none text-text tabular-nums">{value}</p>
      )}
    </Card>
  )
}

function TrainingCalendar({
  year,
  month,
  trainedDates,
  loading,
  labels,
  onPrevious,
  onNext,
}: {
  year: number
  month: number
  trainedDates: string[]
  loading: boolean
  labels: {
    title: string
    previous: string
    next: string
    empty: string
    weekdays: readonly string[]
  }
  onPrevious: () => void
  onNext: () => void
}) {
  const trainedSet = new Set(trainedDates)
  const firstDay = new Date(year, month - 1, 1)
  const monthLabel = format(firstDay, 'MMMM yyyy')
  const daysInMonth = new Date(year, month, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const cells = [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, day: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
  ]
  const hasTraining = trainedSet.size > 0

  return (
    <Card className="w-full" style={{ borderColor: 'var(--surface-border-soft)' }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays size={16} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{labels.title}</h2>
            <p className="text-sm font-semibold text-text">{monthLabel}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!h-8 !min-h-0 !w-8 justify-center !p-0"
            title={labels.previous}
            aria-label={labels.previous}
            onClick={onPrevious}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!h-8 !min-h-0 !w-8 justify-center !p-0"
            title={labels.next}
            aria-label={labels.next}
            onClick={onNext}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-36 items-center justify-center">
          <Spinner size="sm" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1">
            {labels.weekdays.map((day) => (
              <div key={day} className="flex h-5 items-center justify-center text-[11px] font-semibold text-muted">
                {day}
              </div>
            ))}
            {cells.map((cell) => {
              const active = cell.day !== null && trainedSet.has(toIsoDate(year, month, cell.day))
              return (
                <div
                  key={cell.key}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-md text-xs font-semibold',
                    cell.day === null && 'invisible',
                    active ? 'text-white shadow-sm' : 'text-text',
                  )}
                  style={{
                    background: active ? 'var(--color-primary)' : 'var(--bg-2)',
                    border: active ? '1px solid var(--color-primary)' : '1px solid var(--border-1)',
                  }}
                >
                  {cell.day}
                </div>
              )
            })}
          </div>
          {!hasTraining && <p className="mt-4 text-sm text-muted">{labels.empty}</p>}
        </>
      )}
    </Card>
  )
}

function Textarea({
  label,
  error,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
          {label}
        </label>
      )}
      <textarea className={cn('xn-input min-h-28 resize-y text-sm', error && 'error', className)} {...props} />
      {error && (
        <span className="text-xs" style={{ color: 'var(--xn-danger)' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium text-text">{value}</p>
    </div>
  )
}

