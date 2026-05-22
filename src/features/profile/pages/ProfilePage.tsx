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
import { Modal } from '@/shared/components/Modal'
import { Select, type SelectOption } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { cn } from '@/shared/utils/cn'
import { slideUp } from '@/shared/utils/motion'
import { useLangStore, useT } from '@/shared/i18n'
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
  facebookUrl?: string
  instagramUrl?: string
  zaloUrl?: string
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
  const lang = useLangStore((s) => s.lang)
  const mx = marketplaceText(lang)
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
    facebookUrl:  z.string().url('Invalid URL').or(z.literal('')).optional(),
    instagramUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
    zaloUrl:      z.string().url('Invalid URL').or(z.literal('')).optional(),
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
      facebookUrl:  profile?.facebookUrl ?? '',
      instagramUrl: profile?.instagramUrl ?? '',
      zaloUrl:      profile?.zaloUrl ?? '',
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
      bio: data.bio?.trim() ?? '',
      height: data.height,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth || undefined,
      facebookUrl: data.facebookUrl?.trim() || undefined,
      instagramUrl: data.instagramUrl?.trim() || undefined,
      zaloUrl: data.zaloUrl?.trim() || undefined,
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

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {profile && <LevelCard profile={profile} variant="square" className="w-full" />}

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
            <Stat label={tp.bmiStat}    value={profile?.bmi ? `${profile.bmi.toFixed(1)} (${profile.bmiCategory})` : '—'} />
            <Stat label={tp.dotsStat}   value={profile?.dotsScore ? profile.dotsScore.toFixed(1) : '—'} />
            <Stat label={tp.streakStat} value={`${profile?.currentStreak ?? 0} ${tc.days}`} />
          </div>

        {(profile?.facebookUrl || profile?.instagramUrl || profile?.zaloUrl) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {profile?.facebookUrl && (
              <a
                href={profile.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ background: '#1877F220', color: '#1877F2' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
                Facebook
              </a>
            )}
            {profile?.instagramUrl && (
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ background: '#E1147420', color: '#E11474' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Instagram
              </a>
            )}
            {profile?.zaloUrl && (
              <a
                href={profile.zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ background: '#0068FF20', color: '#0068FF' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-3.682 4.63h3.682v1.25h-5.437v-.898l3.682-4.63H12.13V7.35h5.432v.898zM8.938 7.35h1.375v6.778H8.938V7.35zm-2.5 0c.69 0 1.25.56 1.25 1.25S7.128 9.85 6.438 9.85s-1.25-.56-1.25-1.25.56-1.25 1.25-1.25z"/>
                </svg>
                Zalo
              </a>
            )}
          </div>
        )}
        </Card>
      </div>

      {isCoach && (
        <Card>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text">{mx.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {mx.description}
              </p>
            </div>
            {!marketplaceEditing && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setMarketplaceEditing(true)}>
                <Pencil size={14} />
                {mx.edit}
              </Button>
            )}
          </div>

          {marketplace.headline && (
            <p className="mb-4 truncate text-sm font-medium text-text">{localizeMarketplaceValue(marketplace.headline, lang)}</p>
          )}

          {marketplaceEditing ? (
            <div className="space-y-4">
              <Input
                label={mx.headline}
                maxLength={120}
                value={marketplace.headline ?? ''}
                onChange={(event) => setMarketplaceField('headline', event.target.value)}
                placeholder="Powerlifting coach focused on sustainable strength progress"
              />

              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  label={mx.experienceYears}
                  type="number"
                  min="0"
                  max="60"
                  value={marketplace.experienceYears ?? ''}
                  onChange={(event) => setMarketplaceField('experienceYears', event.target.value === '' ? null : Number(event.target.value))}
                />
                <Select
                  label={mx.availability}
                  placeholder={mx.selectAvailability}
                  options={localizeMarketplaceOptions(AVAILABILITY_OPTIONS, lang)}
                  value={marketplace.availability ?? ''}
                  onChange={(value) => setMarketplaceField('availability', value)}
                />
                <Select
                  label={mx.responseTime}
                  placeholder={mx.selectResponseTime}
                  options={localizeMarketplaceOptions(RESPONSE_TIME_OPTIONS, lang)}
                  value={marketplace.responseTime ?? ''}
                  onChange={(value) => setMarketplaceField('responseTime', value)}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
                <Input
                  label={mx.pricePerMonth}
                  type="number"
                  min="0"
                  step="1000"
                  value={marketplace.monthlyPriceAmount ?? ''}
                  onChange={(event) => setMarketplaceField('monthlyPriceAmount', event.target.value === '' ? null : Number(event.target.value))}
                />
                <Input
                  label={mx.pricePerSession}
                  type="number"
                  min="0"
                  step="1000"
                  value={marketplace.sessionPriceAmount ?? ''}
                  onChange={(event) => setMarketplaceField('sessionPriceAmount', event.target.value === '' ? null : Number(event.target.value))}
                />
                <Input
                  label={mx.currency}
                  maxLength={8}
                  value={marketplace.currency ?? 'VND'}
                  onChange={(event) => setMarketplaceField('currency', event.target.value.toUpperCase())}
                />
              </div>

              <Select
                label={mx.coachingStyle}
                placeholder={mx.selectCoachingStyle}
                options={localizeMarketplaceOptions(COACHING_STYLE_OPTIONS, lang)}
                value={marketplace.coachingStyle ?? ''}
                onChange={(value) => setMarketplaceField('coachingStyle', value)}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <ListTextArea
                  label={mx.coachingMethods}
                  values={marketplace.coachingMethods}
                  onChange={(values) => setMarketplaceField('coachingMethods', values)}
                />
                <Select
                  label={mx.languages}
                  placeholder={mx.selectLanguage}
                  options={localizeMarketplaceOptions(LANGUAGE_OPTIONS, lang)}
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
                  {mx.cancel}
                </Button>
                <Button loading={savingMarketplace} onClick={onSaveMarketplace}>
                  {mx.saveProfile}
                </Button>
              </div>
            </div>
          ) : (
            <CoachMarketplaceView marketplace={marketplace} lang={lang} />
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

function CoachMarketplaceView({ marketplace, lang }: { marketplace: CoachMarketplaceProfile; lang: 'en' | 'vi' }) {
  const currency = marketplace.currency || 'VND'
  const mx = marketplaceText(lang)
  const items: [string, string | number | null | undefined][] = [
    [mx.pricePerMonth, formatMoney(marketplace.monthlyPriceAmount, currency)],
    [mx.pricePerSession, formatMoney(marketplace.sessionPriceAmount, currency)],
    [mx.experience, marketplace.experienceYears != null ? `${marketplace.experienceYears} ${mx.yearsShort}` : null],
    [mx.availability, localizeMarketplaceValue(marketplace.availability, lang)],
    [mx.responseTime, localizeMarketplaceValue(marketplace.responseTime, lang)],
    [mx.coachingStyle, localizeMarketplaceValue(marketplace.coachingStyle, lang)],
    [mx.languages, marketplace.languages.map((value) => localizeMarketplaceValue(value, lang)).join(', ') || null],
    [mx.coachingMethods, marketplace.coachingMethods.filter(Boolean).slice(0, 3).map((value) => localizeMarketplaceValue(value, lang)).join(', ') || null],
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

function marketplaceText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      title: 'Marketplace huấn luyện viên',
      description: 'Quản lý thông tin công khai client nhìn thấy trước khi chọn bạn làm coach.',
      edit: 'Sửa',
      headline: 'Tiêu đề',
      experienceYears: 'Số năm kinh nghiệm',
      experience: 'Kinh nghiệm',
      yearsShort: 'năm',
      availability: 'Lịch nhận client',
      responseTime: 'Thời gian phản hồi',
      pricePerMonth: 'Giá mỗi tháng',
      pricePerSession: 'Giá mỗi buổi',
      currency: 'Tiền tệ',
      coachingStyle: 'Phong cách coaching',
      coachingMethods: 'Phương thức coaching',
      languages: 'Ngôn ngữ',
      selectAvailability: 'Chọn lịch nhận client',
      selectResponseTime: 'Chọn thời gian phản hồi',
      selectCoachingStyle: 'Chọn phong cách coaching',
      selectLanguage: 'Chọn ngôn ngữ',
      cancel: 'Hủy',
      saveProfile: 'Lưu hồ sơ',
    }
    : {
      title: 'Coach marketplace',
      description: 'Manage the public information clients see before choosing you as their coach.',
      edit: 'Edit',
      headline: 'Headline',
      experienceYears: 'Experience years',
      experience: 'Experience',
      yearsShort: 'yrs',
      availability: 'Availability',
      responseTime: 'Response time',
      pricePerMonth: 'Price per month',
      pricePerSession: 'Price per session',
      currency: 'Currency',
      coachingStyle: 'Coaching style',
      coachingMethods: 'Coaching methods',
      languages: 'Languages',
      selectAvailability: 'Select availability',
      selectResponseTime: 'Select response time',
      selectCoachingStyle: 'Select coaching style',
      selectLanguage: 'Select language',
      cancel: 'Cancel',
      saveProfile: 'Save profile',
    }
}

function localizeMarketplaceOptions(options: SelectOption[], lang: 'en' | 'vi') {
  return options.map((option) => ({ ...option, label: localizeMarketplaceValue(option.label, lang) }))
}

function localizeMarketplaceValue(value: string | null | undefined, lang: 'en' | 'vi'): string {
  if (!value) return ''
  if (lang !== 'vi') return value
  const map: Record<string, string> = {
    'Online check-ins': 'Check-in online',
    'In-person': 'Trực tiếp',
    'Hybrid (online + in-person)': 'Kết hợp online và trực tiếp',
    'Within 1 hour': 'Trong 1 giờ',
    'Within 4 hours': 'Trong 4 giờ',
    'Within 24 hours': 'Trong 24 giờ',
    'Within 48 hours': 'Trong 48 giờ',
    English: 'Tiếng Anh',
    Vietnamese: 'Tiếng Việt',
    'Strength-focused': 'Tập trung sức mạnh',
    'Hypertrophy-focused': 'Tập trung tăng cơ',
    'Endurance-focused': 'Tập trung sức bền',
    'Functional / mobility': 'Vận động chức năng / linh hoạt',
    'General fitness': 'Thể lực tổng quát',
    'Accepting 3 new online clients this month.': 'Nhận thêm 3 client online trong tháng này.',
    'Usually replies within 24 hours.': 'Thường phản hồi trong vòng 24 giờ.',
    'Direct, practical, and data-informed without overcomplicating training.': 'Trực tiếp, thực tế và dựa trên dữ liệu, không làm phức tạp việc tập luyện.',
    'Weekly check-ins': 'Check-in hằng tuần',
    'Video feedback': 'Feedback qua video',
    'Plan reviews': 'Review plan',
    'Strength coach for intermediate lifters': 'Coach sức mạnh cho người tập trung cấp',
  }
  return map[value] ?? value
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
      label={`${label} (${label === 'Phương thức coaching' ? 'mỗi dòng một mục, tối đa 8' : 'one per line, max 8'})`}
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
