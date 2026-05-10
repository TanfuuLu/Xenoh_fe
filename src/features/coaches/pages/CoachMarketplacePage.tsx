import { useEffect, useRef, useState, type TextareaHTMLAttributes } from 'react'
import { z } from 'zod'
import { BadgeCheck, Pencil } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select, type SelectOption } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { cn } from '@/shared/utils/cn'
import { useMyProfile, useUpdateProfile } from '@/features/profile'
import type { CoachMarketplaceProfile } from '@/features/coaches'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

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


export function CoachMarketplacePage() {
  const { data: profile, isLoading } = useMyProfile()
  const { mutate: saveProfileData, isPending: savingProfile, error: saveProfileError } = useUpdateProfile()
  const [marketplace, setMarketplace] = useState<CoachMarketplaceProfile>(emptyCoachMarketplace)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileEditing, setProfileEditing] = useState(false)
  const initialized = useRef(false)
  const savedMarketplace = useRef<CoachMarketplaceProfile>(emptyCoachMarketplace)

  useEffect(() => {
    if (!profile || initialized.current) return
    initialized.current = true

    const snap: CoachMarketplaceProfile = {
      ...emptyCoachMarketplace,
      ...(profile.coachMarketplaceProfile ?? {}),
      headline: profile.coachMarketplaceProfile?.headline ?? '',
      clientResultsSummary: profile.coachMarketplaceProfile?.clientResultsSummary ?? '',
      availability: profile.coachMarketplaceProfile?.availability ?? '',
      responseTime: profile.coachMarketplaceProfile?.responseTime ?? '',
      coachingStyle: profile.coachMarketplaceProfile?.coachingStyle ?? '',
    }
    setMarketplace(snap)
    savedMarketplace.current = snap
  }, [profile])

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

  function handleSaveProfile() {
    setProfileError(null)
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
      }
      coachMarketplaceSchema.parse(coachMarketplaceProfile)
      saveProfileData({ coachMarketplaceProfile }, {
        onSuccess: () => {
          savedMarketplace.current = coachMarketplaceProfile
          setProfileEditing(false)
        },
      })
    } catch (error) {
      setProfileError(getValidationMessage(error))
    }
  }

  function setField<K extends keyof CoachMarketplaceProfile>(key: K, value: CoachMarketplaceProfile[K]) {
    setMarketplace({ ...marketplace, [key]: value })
  }

  const profileApiError = (saveProfileError as AxiosError<ApiError>)?.response?.data?.message

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BadgeCheck size={28} className="text-muted" />
          <h1 className="text-2xl font-bold text-text">Coach Marketplace</h1>
        </div>
        <p className="mt-1 text-muted">Manage the public information clients see before choosing you as their coach.</p>
      </div>

      {/* Profile details */}
      <Card>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text">Profile details</h2>
            <p className="mt-1 text-sm text-muted">
              These details explain your coaching focus, process, credentials, and availability.
            </p>
          </div>
          {!profileEditing && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setProfileEditing(true)}>
              <Pencil size={14} />
              Edit
            </Button>
          )}
        </div>

        {marketplace.headline && (
          <p className="mb-4 truncate text-sm font-medium text-text">{marketplace.headline}</p>
        )}

        {profileEditing ? (
          <div className="space-y-4">
            <Input
              label="Headline"
              maxLength={120}
              value={marketplace.headline ?? ''}
              onChange={(event) => setField('headline', event.target.value)}
              placeholder="Powerlifting coach focused on sustainable strength progress"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <Input
                label="Experience years"
                type="number"
                min="0"
                max="60"
                value={marketplace.experienceYears ?? ''}
                onChange={(event) => setField('experienceYears', event.target.value === '' ? null : Number(event.target.value))}
              />
              <Select
                label="Availability"
                placeholder="Select availability"
                options={AVAILABILITY_OPTIONS}
                value={marketplace.availability ?? ''}
                onChange={(value) => setField('availability', value)}
              />
              <Select
                label="Response time"
                placeholder="Select response time"
                options={RESPONSE_TIME_OPTIONS}
                value={marketplace.responseTime ?? ''}
                onChange={(value) => setField('responseTime', value)}
              />
            </div>

            <Select
              label="Coaching style"
              placeholder="Select coaching style"
              options={COACHING_STYLE_OPTIONS}
              value={marketplace.coachingStyle ?? ''}
              onChange={(value) => setField('coachingStyle', value)}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <ListTextArea label="Coaching methods" values={marketplace.coachingMethods} onChange={(values) => setField('coachingMethods', values)} />
              <Select
                label="Languages"
                placeholder="Select language"
                options={LANGUAGE_OPTIONS}
                value={marketplace.languages[0] ?? ''}
                onChange={(value) => setField('languages', value ? [value] : [])}
              />
            </div>

            {(profileError || profileApiError) && (
              <p className="text-sm text-danger">{profileError ?? profileApiError}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMarketplace(savedMarketplace.current)
                  setProfileEditing(false)
                  setProfileError(null)
                }}
              >
                Cancel
              </Button>
              <Button loading={savingProfile} onClick={handleSaveProfile}>
                Save profile
              </Button>
            </div>
          </div>
        ) : (
          <ProfileView m={marketplace} />
        )}
      </Card>
    </div>
  )
}


function ProfileView({ m }: { m: CoachMarketplaceProfile }) {
  const items: [string, string | number | null | undefined][] = [
    ['Experience', m.experienceYears != null ? `${m.experienceYears} yrs` : null],
    ['Availability', m.availability],
    ['Response time', m.responseTime],
    ['Coaching style', m.coachingStyle],
    ['Languages', m.languages.join(', ') || null],
    ['Coaching methods', m.coachingMethods.filter(Boolean).slice(0, 3).join(', ') || null],
  ]
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="text-sm text-text">{value != null && value !== '' ? value : <span className="text-muted">—</span>}</dd>
        </div>
      ))}
    </dl>
  )
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
