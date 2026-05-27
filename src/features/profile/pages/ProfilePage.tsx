import { useRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera } from 'lucide-react'
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
  useMyProfile,
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
  gender?: 'Male' | 'Female' | 'Other'
  dateOfBirth?: string
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

export function ProfilePage() {
  const [editMode, setEditMode] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { data: profile, isLoading } = useMyProfile()
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

        </Card>
      </div>

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

