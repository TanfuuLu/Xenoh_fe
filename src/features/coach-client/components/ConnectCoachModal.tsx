import { useState, useMemo } from 'react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import { useRequestCoach } from '../api/useCoachClient'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

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
  const { mutate, isPending, error, reset } = useRequestCoach()

  const today = useMemo(() => todayISO(), [])

  const startError = startDate && startDate < today ? 'Ngày bắt đầu không được trong quá khứ.' : undefined
  const endError =
    endDate && startDate && endDate <= startDate ? 'Ngày kết thúc phải sau ngày bắt đầu.' : undefined
  const apiError = (error as AxiosError<ApiError>)?.response?.data?.message
  const canSubmit = !!startDate && !!endDate && !startError && !endError

  function handleClose() {
    reset()
    setStartDate(todayISO())
    setEndDate('')
    onClose()
  }

  function handleSubmit() {
    if (!canSubmit) return
    mutate(
      { coachId, startDate, endDate },
      {
        onSuccess: () => {
          onSuccess?.()
          handleClose()
        },
      },
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Kết nối với ${coachName}`}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Chọn khoảng thời gian hợp đồng huấn luyện. Khi đến ngày kết thúc, bạn có thể gửi yêu cầu gia hạn hoặc kết thúc hợp đồng.
        </p>

        <DateRangePicker
          startValue={startDate}
          endValue={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          startLabel="Ngày bắt đầu"
          endLabel="Ngày kết thúc"
          startError={startError}
          endError={endError}
        />

        {apiError && <p className="text-sm text-danger">{apiError}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Hủy
          </Button>
          <Button loading={isPending} disabled={!canSubmit} onClick={handleSubmit}>
            Gửi yêu cầu
          </Button>
        </div>
      </div>
    </Modal>
  )
}
