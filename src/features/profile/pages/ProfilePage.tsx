import { useRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Camera, Star, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { useCoachProfile } from '@/features/coaches'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, isValid } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { DatePicker } from '@/shared/components/DatePicker'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { LevelCard } from '@/features/dashboard/components/LevelCard'
import { InlineTip } from '@/features/tips'
import {
  useMyProfile,
  useUpdateAvatar,
  useUpdateProfile,
  useLogBodyweight,
  useBodyweightHistory,
  useDeleteBodyweight,
} from '../index'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

type ProfileForm = {
  firstName: string
  lastName: string
  bio?: string
  height?: number
  gender?: 'Male' | 'Female' | 'Other'
  dateOfBirth?: string
}
type WeightForm  = { weight: number }

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

export function ProfilePage() {
  const [editMode, setEditMode] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { data: profile, isLoading } = useMyProfile()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const { data: coachProfile } = useCoachProfile(isCoach ? (profile?.id ?? '') : '')
  const { data: bwHistory } = useBodyweightHistory()
  const { mutate: updateProfile, isPending: saving, error: saveError } = useUpdateProfile()
  const { mutate: updateAvatar, isPending: avatarUploading } = useUpdateAvatar()
  const { mutate: logWeight, isPending: logging } = useLogBodyweight()
  const { mutate: deleteWeight } = useDeleteBodyweight()
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
  })

  const weightSchema = z.object({
    weight: z.coerce.number().min(20, tp.minWeightError).max(500, tp.maxWeightError),
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
    },
  })

  const {
    register: regWeight,
    handleSubmit: handleWeightSubmit,
    reset: resetWeight,
    formState: { errors: weightErrors },
  } = useForm<z.input<typeof weightSchema>, unknown, WeightForm>({
    resolver: zodResolver(weightSchema),
  })

  function onSaveProfile(data: ProfileForm) {
    updateProfile({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      bio: data.bio?.trim() || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
    }, { onSuccess: () => setEditMode(false) })
  }

  function onLogWeight(data: WeightForm) {
    logWeight(data, { onSuccess: () => resetWeight() })
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

  const bodyweightHistory = Array.isArray(bwHistory) ? bwHistory : []

  const chartData = [...bodyweightHistory]
    .reverse()
    .slice(-30)
    .map((b) => ({ date: formatDisplayDate(b.date, 'dd/MM'), weight: b.weight, id: b.id }))
    .filter((b) => b.date !== '—')

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">{tp.title}</h1>

      <InlineTip placement="profile" />

      {profile && <LevelCard profile={profile} />}

      {/* Profile info */}
      <Card>
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
          <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => setEditMode((e) => !e)}>
            {editMode ? tp.cancelBtn : tp.editBtn}
          </Button>
        </div>

        {editMode ? (
          <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="grid gap-3 sm:grid-cols-2">
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
            {apiError && <p className="text-sm text-danger">{apiError}</p>}
            <Button type="submit" className="w-full sm:w-auto" loading={saving}>{tp.saveBtn}</Button>
          </form>
        ) : (
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
            <Stat label={tp.bmiStat}    value={profile?.bmi ? `${profile.bmi.toFixed(1)} (${profile.bmiCategory})` : '—'} />
            <Stat label={tp.dotsStat}   value={profile?.dotsScore ? profile.dotsScore.toFixed(1) : '—'} />
            <Stat label={tp.streakStat} value={`${profile?.currentStreak ?? 0} ${tc.days}`} />
          </div>
        )}
      </Card>

      {/* Bodyweight */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-text">{tp.weightSection}</h2>

        <form onSubmit={handleWeightSubmit(onLogWeight)} className="mb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              placeholder="70.5"
              type="number"
              step="0.1"
              className={cn('xn-input sm:max-w-32', weightErrors.weight && 'error')}
              {...regWeight('weight')}
            />
            <Button type="submit" className="w-full sm:w-auto" loading={logging}>{tp.logToday}</Button>
          </div>
          {weightErrors.weight?.message && (
            <span className="mt-1.5 block text-xs" style={{ color: 'var(--xn-danger)' }}>
              {weightErrors.weight.message}
            </span>
          )}
        </form>

        {chartData.length > 0 ? (
          <motion.div initial="hidden" animate="visible" variants={slideUp} className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--fg-3)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--fg-3)', fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--fg-1)' }}
                  itemStyle={{ color: 'var(--xn-clay-700)' }}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--xn-clay-700)" strokeWidth={2} dot={{ fill: 'var(--xn-clay-700)', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <p className="text-sm text-muted">{tp.noWeightData}</p>
        )}

        {/* History list */}
        {bodyweightHistory.length > 0 && (
          <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
            {bodyweightHistory.slice(0, 10).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-panel">
                <span className="text-sm text-text">{formatDisplayDate(b.date)}</span>
                <span className="text-sm font-medium text-text">{b.weight} kg</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteWeight(b.id)}
                >
                  <Trash2 size={13} className="text-danger" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Coach ratings */}
      {isCoach && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">My Ratings</h2>
            <div className="flex items-center gap-2">
              <StarDisplay rating={coachProfile?.averageRating ?? 0} />
              <span className="text-lg font-bold text-text">
                {coachProfile?.averageRating?.toFixed(1) ?? '—'}
              </span>
              <span className="text-sm text-muted">({coachProfile?.ratingCount ?? 0})</span>
            </div>
          </div>

          {(coachProfile?.ratings?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {coachProfile!.ratings.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl px-4 py-3 space-y-1"
                  style={{ background: 'var(--bg-2)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-text">{r.clientName}</span>
                    <div className="flex items-center gap-1">
                      <StarDisplay rating={r.rating} />
                      <span className="text-xs text-muted ml-1">
                        {formatDisplayDate(r.createdAt)}
                      </span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted leading-relaxed">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= Math.round(rating) ? 'text-warning' : 'text-muted'}
          fill={s <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </div>
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
