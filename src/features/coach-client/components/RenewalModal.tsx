import { useState, useMemo } from 'react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import { useRequestRenewal } from '../api/useCoachClient'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

interface Props {
  open: boolean
  relationshipId: string
  currentEndDate: string | null
  onClose: () => void
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function RenewalModal({ open, relationshipId, currentEndDate, onClose }: Props) {
  const [proposedEndDate, setProposedEndDate] = useState<string>('')
  const { mutate, isPending, error, reset } = useRequestRenewal()

  const floor = useMemo(() => {
    const today = todayISO()
    return currentEndDate && currentEndDate > today ? currentEndDate : today
  }, [currentEndDate])

  const dateError =
    proposedEndDate && proposedEndDate <= floor
      ? 'Ngày kết thúc mới phải sau ngày kết thúc hiện tại.'
      : undefined
  const apiError = (error as AxiosError<ApiError>)?.response?.data?.message
  const canSubmit = !!proposedEndDate && !dateError

  function handleClose() {
    reset()
    setProposedEndDate('')
    onClose()
  }

  function handleSubmit() {
    if (!canSubmit) return
    mutate(
      { relationshipId, proposedEndDate },
      { onSuccess: handleClose },
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Gia hạn hợp đồng">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Đề xuất ngày kết thúc mới. Đối tác sẽ nhận thông báo và quyết định chấp nhận hoặc từ chối.
        </p>

        <DateRangePicker
          startValue={floor}
          endValue={proposedEndDate}
          onEndChange={setProposedEndDate}
          startLabel="Ngày kết thúc hiện tại"
          endLabel="Ngày kết thúc mới"
          endError={dateError}
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
