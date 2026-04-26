import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import {
  useMyProfile,
  useUpdateProfile,
  useLogBodyweight,
  useBodyweightHistory,
  useDeleteBodyweight,
} from '../index'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

type ProfileForm = { height?: number; gender?: 'Male' | 'Female' | 'Other'; dateOfBirth?: string }
type WeightForm  = { weight: number }

export function ProfilePage() {
  const [editMode, setEditMode] = useState(false)
  const { data: profile, isLoading } = useMyProfile()
  const { data: bwHistory } = useBodyweightHistory()
  const { mutate: updateProfile, isPending: saving, error: saveError } = useUpdateProfile()
  const { mutate: logWeight, isPending: logging } = useLogBodyweight()
  const { mutate: deleteWeight } = useDeleteBodyweight()
  const t  = useT()
  const tp = t.profile
  const tc = t.common

  // Build schemas inside component for translated error messages
  const profileSchema = z.object({
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
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      height: profile?.height ?? undefined,
      gender: profile?.gender ?? undefined,
      dateOfBirth: profile?.dateOfBirth ?? undefined,
    },
  })

  const {
    register: regWeight,
    handleSubmit: handleWeightSubmit,
    reset: resetWeight,
    formState: { errors: weightErrors },
  } = useForm<WeightForm>({ resolver: zodResolver(weightSchema) })

  function onSaveProfile(data: ProfileForm) {
    updateProfile(data, { onSuccess: () => setEditMode(false) })
  }

  function onLogWeight(data: WeightForm) {
    logWeight(data, { onSuccess: () => resetWeight() })
  }

  const apiError = (saveError as AxiosError<ApiError>)?.response?.data?.message

  const chartData = [...(bwHistory ?? [])]
    .reverse()
    .slice(-30)
    .map((b) => ({ date: format(new Date(b.date), 'dd/MM'), weight: b.weight, id: b.id }))

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

      {/* Profile info */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <p className="text-sm text-muted">{profile?.email}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditMode((e) => !e)}>
            {editMode ? tp.cancelBtn : tp.editBtn}
          </Button>
        </div>

        {editMode ? (
          <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label={tp.heightLabel} type="number" step="0.1" error={profileErrors.height?.message} {...regProfile('height')} />
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
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <Input label={tp.dobLabel} type="date" {...regProfile('dateOfBirth')} />
            {apiError && <p className="text-sm text-danger">{apiError}</p>}
            <Button type="submit" loading={saving}>{tp.saveBtn}</Button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label={tp.heightStat} value={profile?.height ? `${profile.height} cm` : '—'} />
            <Stat label={tp.genderStat} value={profile?.gender === 'Male' ? tp.male : profile?.gender === 'Female' ? tp.female : profile?.gender === 'Other' ? tp.other : '—'} />
            <Stat label={tp.dobStat}    value={profile?.dateOfBirth ? format(new Date(profile.dateOfBirth), 'dd/MM/yyyy') : '—'} />
            <Stat label={tp.bmiStat}    value={profile?.bmi ? `${profile.bmi.toFixed(1)} (${profile.bmiCategory})` : '—'} />
            <Stat label={tp.dotsStat}   value={profile?.dotsScore ? profile.dotsScore.toFixed(1) : '—'} />
            <Stat label={tp.streakStat} value={`${profile?.currentStreak ?? 0} ${tc.days}`} />
          </div>
        )}
      </Card>

      {/* Bodyweight */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-text">{tp.weightSection}</h2>

        <form onSubmit={handleWeightSubmit(onLogWeight)} className="mb-4 flex gap-2">
          <Input
            placeholder="70.5"
            type="number"
            step="0.1"
            error={weightErrors.weight?.message}
            className="max-w-32"
            {...regWeight('weight')}
          />
          <Button type="submit" loading={logging} size="sm">{tp.logToday}</Button>
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
        {bwHistory && bwHistory.length > 0 && (
          <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
            {bwHistory.slice(0, 10).map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-panel">
                <span className="text-sm text-text">{format(new Date(b.date), 'dd/MM/yyyy')}</span>
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
