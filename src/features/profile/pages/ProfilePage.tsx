import { useEffect, useRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Camera, Pencil, Star, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { useCoachProfile, type CoachMarketplaceProfile } from '@/features/coaches'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, isValid } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { DatePicker } from '@/shared/components/DatePicker'
import { Select, type SelectOption } from '@/shared/components/Select'
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

const emptyCoachMarketplace: CoachMarketplaceProfile = {
  headline: '',
  experienceYears: null,
  specialties: [],
  certifications: [],
  languages: [],
  coachingMethods: [],
  achievements: [],
  clientResultsSummary: '',
  availability: '',
  responseTime: '',
  coachingStyle: '',
  monthlyPriceAmount: null,
  sessionPriceAmount: null,
  currency: 'VND',
}

const coachMarketplaceSchema = z.object({
  headline: z.string().max(120).nullable().optional(),
  experienceYears: z.number().min(0).max(60).nullable().optional(),
  specialties: z.array(z.string().trim().min(1).max(60)).max(8),
  certifications: z.array(z.string().trim().min(1).max(60)).max(8),
  languages: z.array(z.string().trim().min(1).max(60)).max(8),
  coachingMethods: z.array(z.string().trim().min(1).max(60)).max(8),
  achievements: z.array(z.string().trim().min(1).max(60)).max(8),
  clientResultsSummary: z.string().max(500).nullable().optional(),
  availability: z.string().max(500).nullable().optional(),
  responseTime: z.string().max(500).nullable().optional(),
  coachingStyle: z.string().max(500).nullable().optional(),
  monthlyPriceAmount: z.number().min(0).nullable().optional(),
  sessionPriceAmount: z.number().min(0).nullable().optional(),
  currency: z.string().trim().min(1).max(8),
})

const AVAILABILITY_OPTIONS: SelectOption[] = [
  { value: 'Online check-ins', label: 'Online check-ins' },
  { value: 'In-person', label: 'In-person' },
  { value: 'Hybrid (online + in-person)', label: 'Hybrid (online + in-person)' },
]

const RESPONSE_TIME_OPTIONS: SelectOption[] = [
  { value: 'Within 1 hour', label: 'Within 1 hour' },
  { value: 'Within 4 hours', label: 'Within 4 hours' },
  { value: 'Within 24 hours', label: 'Within 24 hours' },
  { value: 'Within 48 hours', label: 'Within 48 hours' },
]

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'English', label: 'English' },
  { value: 'Vietnamese', label: 'Vietnamese' },
]

const COACHING_STYLE_OPTIONS: SelectOption[] = [
  { value: 'Strength-focused', label: 'Strength-focused' },
  { value: 'Hypertrophy-focused', label: 'Hypertrophy-focused' },
  { value: 'Endurance-focused', label: 'Endurance-focused' },
  { value: 'Functional / mobility', label: 'Functional / mobility' },
  { value: 'General fitness', label: 'General fitness' },
]

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
  const [marketplace, setMarketplace] = useState<CoachMarketplaceProfile>(emptyCoachMarketplace)
  const [marketplaceEditing, setMarketplaceEditing] = useState(false)
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const initializedMarketplace = useRef(false)
  const savedMarketplace = useRef<CoachMarketplaceProfile>(emptyCoachMarketplace)
  const { data: profile, isLoading } = useMyProfile()
  const isCoach = useAuthStore((s) => s.user?.roles?.includes('Coach') ?? false)
  const { data: coachProfile } = useCoachProfile(isCoach ? (profile?.id ?? '') : '')
  const { data: bwHistory } = useBodyweightHistory()
  const { mutate: updateProfile, isPending: saving, error: saveError } = useUpdateProfile()
  const { mutate: updateMarketplace, isPending: savingMarketplace, error: marketplaceSaveError } = useUpdateProfile()
  const { mutate: updateAvatar, isPending: avatarUploading } = useUpdateAvatar()
  const { mutate: logWeight, isPending: logging } = useLogBodyweight()
  const { mutate: deleteWeight } = useDeleteBodyweight()
  const t  = useT()
  const tp = t.profile
  const tc = t.common

  useEffect(() => {
    if (!profile || initializedMarketplace.current) return
    initializedMarketplace.current = true

    const snapshot: CoachMarketplaceProfile = {
      ...emptyCoachMarketplace,
      ...(profile.coachMarketplaceProfile ?? {}),
      headline: profile.coachMarketplaceProfile?.headline ?? '',
      clientResultsSummary: profile.coachMarketplaceProfile?.clientResultsSummary ?? '',
      availability: profile.coachMarketplaceProfile?.availability ?? '',
      responseTime: profile.coachMarketplaceProfile?.responseTime ?? '',
      coachingStyle: profile.coachMarketplaceProfile?.coachingStyle ?? '',
      currency: profile.coachMarketplaceProfile?.currency ?? 'VND',
    }

    setMarketplace(snapshot)
    savedMarketplace.current = snapshot
  }, [profile])

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

  function cleanText(value: string | null | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  }

  function cleanList(values: string[]) {
    return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).slice(0, 8)
  }

  function getValidationMessage(error: unknown) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? 'Information is invalid.'
    }
    return error instanceof Error ? error.message : 'Information is invalid.'
  }

  function setMarketplaceField<K extends keyof CoachMarketplaceProfile>(key: K, value: CoachMarketplaceProfile[K]) {
    setMarketplace({ ...marketplace, [key]: value })
  }

  function onSaveMarketplace() {
    setMarketplaceError(null)

    try {
      const coachMarketplaceProfile: CoachMarketplaceProfile = {
        headline: cleanText(marketplace.headline),
        experienceYears: marketplace.experienceYears,
        specialties: cleanList(marketplace.specialties),
        certifications: cleanList(marketplace.certifications),
        languages: cleanList(marketplace.languages),
        coachingMethods: cleanList(marketplace.coachingMethods),
        achievements: cleanList(marketplace.achievements),
        clientResultsSummary: cleanText(marketplace.clientResultsSummary),
        availability: cleanText(marketplace.availability),
        responseTime: cleanText(marketplace.responseTime),
        coachingStyle: cleanText(marketplace.coachingStyle),
        monthlyPriceAmount: marketplace.monthlyPriceAmount,
        sessionPriceAmount: marketplace.sessionPriceAmount,
        currency: cleanText(marketplace.currency) ?? 'VND',
      }

      coachMarketplaceSchema.parse(coachMarketplaceProfile)
      updateMarketplace({ coachMarketplaceProfile }, {
        onSuccess: () => {
          savedMarketplace.current = coachMarketplaceProfile
          setMarketplace(coachMarketplaceProfile)
          setMarketplaceEditing(false)
        },
      })
    } catch (error) {
      setMarketplaceError(getValidationMessage(error))
    }
  }

  const apiError = (saveError as AxiosError<ApiError>)?.response?.data?.message
  const marketplaceApiError = (marketplaceSaveError as AxiosError<ApiError>)?.response?.data?.message

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
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-text">{tp.title}</h1>
        <InlineTip placement="profile" />
      </div>

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

      {isCoach && (
        <Card>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">Coach marketplace</h2>
              <p className="mt-1 text-sm text-muted">
                Manage the public information clients see before choosing you as their coach.
              </p>
            </div>
            {!marketplaceEditing && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setMarketplaceEditing(true)}>
                <Pencil size={14} />
                Edit
              </Button>
            )}
          </div>

          {marketplace.headline && (
            <p className="mb-4 truncate text-sm font-medium text-text">{marketplace.headline}</p>
          )}

          {marketplaceEditing ? (
            <div className="space-y-4">
              <Input
                label="Headline"
                maxLength={120}
                value={marketplace.headline ?? ''}
                onChange={(event) => setMarketplaceField('headline', event.target.value)}
                placeholder="Powerlifting coach focused on sustainable strength progress"
              />

              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  label="Experience years"
                  type="number"
                  min="0"
                  max="60"
                  value={marketplace.experienceYears ?? ''}
                  onChange={(event) => setMarketplaceField('experienceYears', event.target.value === '' ? null : Number(event.target.value))}
                />
                <Select
                  label="Availability"
                  placeholder="Select availability"
                  options={AVAILABILITY_OPTIONS}
                  value={marketplace.availability ?? ''}
                  onChange={(value) => setMarketplaceField('availability', value)}
                />
                <Select
                  label="Response time"
                  placeholder="Select response time"
                  options={RESPONSE_TIME_OPTIONS}
                  value={marketplace.responseTime ?? ''}
                  onChange={(value) => setMarketplaceField('responseTime', value)}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
                <Input
                  label="Price per month"
                  type="number"
                  min="0"
                  step="1000"
                  value={marketplace.monthlyPriceAmount ?? ''}
                  onChange={(event) => setMarketplaceField('monthlyPriceAmount', event.target.value === '' ? null : Number(event.target.value))}
                />
                <Input
                  label="Price per session"
                  type="number"
                  min="0"
                  step="1000"
                  value={marketplace.sessionPriceAmount ?? ''}
                  onChange={(event) => setMarketplaceField('sessionPriceAmount', event.target.value === '' ? null : Number(event.target.value))}
                />
                <Input
                  label="Currency"
                  maxLength={8}
                  value={marketplace.currency ?? 'VND'}
                  onChange={(event) => setMarketplaceField('currency', event.target.value.toUpperCase())}
                />
              </div>

              <Select
                label="Coaching style"
                placeholder="Select coaching style"
                options={COACHING_STYLE_OPTIONS}
                value={marketplace.coachingStyle ?? ''}
                onChange={(value) => setMarketplaceField('coachingStyle', value)}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <ListTextArea
                  label="Coaching methods"
                  values={marketplace.coachingMethods}
                  onChange={(values) => setMarketplaceField('coachingMethods', values)}
                />
                <Select
                  label="Languages"
                  placeholder="Select language"
                  options={LANGUAGE_OPTIONS}
                  value={marketplace.languages[0] ?? ''}
                  onChange={(value) => setMarketplaceField('languages', value ? [value] : [])}
                />
              </div>

              {(marketplaceError || marketplaceApiError) && (
                <p className="text-sm text-danger">{marketplaceError ?? marketplaceApiError}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMarketplace(savedMarketplace.current)
                    setMarketplaceEditing(false)
                    setMarketplaceError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button loading={savingMarketplace} onClick={onSaveMarketplace}>
                  Save profile
                </Button>
              </div>
            </div>
          ) : (
            <CoachMarketplaceView marketplace={marketplace} />
          )}
        </Card>
      )}

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

function CoachMarketplaceView({ marketplace }: { marketplace: CoachMarketplaceProfile }) {
  const currency = marketplace.currency || 'VND'
  const items: [string, string | number | null | undefined][] = [
    ['Price per month', formatMoney(marketplace.monthlyPriceAmount, currency)],
    ['Price per session', formatMoney(marketplace.sessionPriceAmount, currency)],
    ['Experience', marketplace.experienceYears != null ? `${marketplace.experienceYears} yrs` : null],
    ['Availability', marketplace.availability],
    ['Response time', marketplace.responseTime],
    ['Coaching style', marketplace.coachingStyle],
    ['Languages', marketplace.languages.join(', ') || null],
    ['Coaching methods', marketplace.coachingMethods.filter(Boolean).slice(0, 3).join(', ') || null],
  ]

  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="text-sm text-text">
            {value != null && value !== '' ? value : <span className="text-muted">-</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function formatMoney(value: number | null | undefined, currency: string) {
  if (value == null) return null
  return `${new Intl.NumberFormat('vi-VN').format(value)} ${currency}`
}

function ListTextArea({
  label,
  values,
  onChange,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <Textarea
      label={`${label} (one per line, max 8)`}
      rows={5}
      value={values.join('\n')}
      onChange={(event) => onChange(event.target.value.split('\n'))}
    />
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
