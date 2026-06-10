import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { useT } from '@/shared/i18n'
import { useCycleSettings, useUpdateCycleSettings } from '../api/useCycle'

interface Props {
  open: boolean
  onClose: () => void
}

export function CycleSettingsModal({ open, onClose }: Props) {
  const t = useT()
  const tc = t.cycle
  const { data: settings } = useCycleSettings(open)
  const update = useUpdateCycleSettings()

  const [cycleLen, setCycleLen] = useState('')
  const [periodLen, setPeriodLen] = useState('')
  const [share, setShare] = useState(false)

  useEffect(() => {
    if (!open) return
    setCycleLen(settings?.averageCycleLengthOverride?.toString() ?? '')
    setPeriodLen(settings?.averagePeriodLengthOverride?.toString() ?? '')
    setShare(settings?.shareWithCoach ?? false)
  }, [open, settings])

  function parseOptional(value: string): number | null {
    const n = parseInt(value, 10)
    return Number.isFinite(n) ? n : null
  }

  function handleSave() {
    update.mutate(
      {
        averageCycleLengthOverride: parseOptional(cycleLen),
        averagePeriodLengthOverride: parseOptional(periodLen),
        shareWithCoach: share,
      },
      { onSuccess: onClose },
    )
  }

  const apiError = (update.error as { response?: { data?: { message?: string } } } | null)
    ?.response?.data?.message

  return (
    <Modal open={open} onClose={onClose} title={tc.settings.title} className="max-w-md">
      <div className="space-y-5">
        <NumberField
          label={tc.settings.cycleLengthLabel}
          hint={tc.settings.cycleLengthHint}
          value={cycleLen}
          placeholder={tc.settings.auto}
          min={15}
          max={60}
          onChange={setCycleLen}
        />
        <NumberField
          label={tc.settings.periodLengthLabel}
          hint={tc.settings.periodLengthHint}
          value={periodLen}
          placeholder={tc.settings.auto}
          min={1}
          max={10}
          onChange={setPeriodLen}
        />

        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-1)', background: 'var(--bg-2)' }}>
          <label className="flex cursor-pointer items-start justify-between gap-3">
            <span className="flex items-start gap-2">
              <Lock size={15} className="mt-0.5 flex-shrink-0 text-muted" />
              <span>
                <span className="text-sm font-medium text-text">{tc.settings.shareLabel}</span>
                <span className="mt-0.5 block text-xs text-muted">{tc.settings.shareHint}</span>
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={share}
              onClick={() => setShare((v) => !v)}
              className="relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors"
              style={{ background: share ? '#f43f5e' : 'var(--bg-3)' }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                style={{ left: share ? 22 : 2 }}
              />
            </button>
          </label>
        </div>

        {apiError && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--xn-danger-bg)', color: 'var(--xn-danger)' }}>
            {apiError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleSave} loading={update.isPending}>
            {tc.settings.save}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function NumberField({
  label,
  hint,
  value,
  placeholder,
  min,
  max,
  onChange,
}: {
  label: string
  hint: string
  value: string
  placeholder: string
  min: number
  max: number
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>
        {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="xn-input w-full"
      />
      <p className="text-xs text-muted">{hint}</p>
    </div>
  )
}
