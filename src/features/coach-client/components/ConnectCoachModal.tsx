import { useEffect, useMemo, useState } from 'react'
import { addDays, addMonths, format, parseISO } from 'date-fns'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import { Input } from '@/shared/components/Input'
import { useCoachProfile } from '@/features/coaches'
import { useRequestCoach } from '../api/useCoachClient'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'
import type { CoachingType } from '../types'
import { formatContractPrice } from '../utils/contractDisplay'

interface Props {
  open: boolean
  coachId: string
  coachName: string
  onClose: () => void
  onSuccess?: () => void
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ConnectCoachModal({ open, coachId, coachName, onClose, onSuccess }: Props) {
  const [startDate, setStartDate] = useState<string>(todayISO())
  const [endDate, setEndDate] = useState<string>('')
  const [coachingType, setCoachingType] = useState<CoachingType | null>(null)
  const [quantity, setQuantity] = useState<string>('')
  const { data: coach } = useCoachProfile(open ? coachId : '')
  const { mutate, isPending, error, reset } = useRequestCoach()

  const today = useMemo(() => todayISO(), [])
  const pricingOptions = useMemo(() => {
    const marketplace = coach?.marketplaceProfile
    const currency = marketplace?.currency ?? 'VND'
    return [
      { type: 'Monthly' as const, label: 'Price per month', price: marketplace?.monthlyPriceAmount ?? null, currency },
      { type: 'Session' as const, label: 'Price per session', price: marketplace?.sessionPriceAmount ?? null, currency },
    ].filter((option) => option.price !== null)
  }, [coach?.marketplaceProfile])

  const startError = startDate && startDate < today ? 'Start date cannot be in the past.' : undefined
  const endError = endDate && startDate && endDate <= startDate ? 'End date must be after start date.' : undefined
  const quantityValue = Number(quantity)
  const quantityError = quantity && (!Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 120)
    ? 'Quantity must be between 1 and 120.'
    : undefined
  const apiError = (error as AxiosError<ApiError>)?.response?.data?.message
  const canSubmit = !!startDate && !!endDate && !!coachingType && quantityValue >= 1 && quantityValue <= 120 && !startError && !endError && !quantityError

  useEffect(() => {
    if (!startDate || !coachingType || !Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 120) {
      setEndDate('')
      return
    }

    const start = parseISO(startDate)
    const calculatedEnd = coachingType === 'Monthly'
      ? addMonths(start, quantityValue)
      : addDays(start, quantityValue)
    const nextEndDate = format(calculatedEnd, 'yyyy-MM-dd')

    setEndDate((current) => current === nextEndDate ? current : nextEndDate)
  }, [coachingType, quantityValue, startDate])

  function handleClose() {
    reset()
    setStartDate(todayISO())
    setEndDate('')
    setCoachingType(null)
    setQuantity('')
    onClose()
  }

  function handleSubmit() {
    if (!canSubmit) return
    mutate(
      { coachId, startDate, endDate, coachingType: coachingType!, quantity: quantityValue },
      {
        onSuccess: () => {
          onSuccess?.()
          handleClose()
        },
      },
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Connect with ${coachName}`}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Choose a coaching type and contract date range. The selected price is saved with this request.
        </p>

        <div className="space-y-2">
          <p className="text-sm font-medium text-text">Coaching type</p>
          {pricingOptions.length === 0 ? (
            <p className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-muted">
              This coach has not configured pricing yet.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {pricingOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    setCoachingType(option.type)
                    setQuantity('')
                  }}
                  className="rounded-lg border px-3 py-2 text-left transition-colors"
                  style={{
                    borderColor: coachingType === option.type ? 'var(--color-primary)' : 'var(--border-1)',
                    background: coachingType === option.type ? 'var(--bg-3)' : 'var(--bg-2)',
                  }}
                >
                  <span className="block text-xs text-muted">{option.label}</span>
                  <span className="block text-sm font-semibold text-text">
                    {formatContractPrice(option.price, option.currency)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {coachingType && (
          <Input
            label={coachingType === 'Monthly' ? 'Number of months' : 'Number of sessions'}
            type="number"
            min="1"
            max="120"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            error={quantityError}
            placeholder={coachingType === 'Monthly' ? '3' : '10'}
          />
        )}

        <DateRangePicker
          startValue={startDate}
          endValue={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          startLabel="Start date"
          endLabel="End date"
          startError={startError}
          endError={endError}
        />

        {apiError && <p className="text-sm text-danger">{apiError}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button loading={isPending} disabled={!canSubmit} onClick={handleSubmit}>
            Send request
          </Button>
        </div>
      </div>
    </Modal>
  )
}
