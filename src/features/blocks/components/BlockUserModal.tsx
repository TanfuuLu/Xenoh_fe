import { useState } from 'react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { useBlockUser } from '../api/useBlocks'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

interface Props {
  open: boolean
  userId: string
  userName: string
  onClose: () => void
  onSuccess?: () => void
}

export function BlockUserModal({ open, userId, userName, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const { mutate, isPending, error, reset } = useBlockUser()
  const apiError = (error as AxiosError<ApiError>)?.response?.data?.message

  function handleClose() {
    reset()
    setReason('')
    onClose()
  }

  function handleSubmit() {
    mutate(
      { userId, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onSuccess?.()
          handleClose()
        },
      },
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Chặn ${userName}`}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Người dùng này sẽ không thể gửi yêu cầu kết nối, đánh giá hoặc báo cáo bạn. Bạn không thể chặn đối tác đang trong quan hệ huấn luyện — hãy kết thúc trước.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Lý do (không bắt buộc)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            className="xn-input min-h-24 resize-y"
            placeholder="Ví dụ: spam, quấy rối..."
          />
        </label>

        {apiError && <p className="text-sm text-danger">{apiError}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="danger" loading={isPending} onClick={handleSubmit}>
            Chặn
          </Button>
        </div>
      </div>
    </Modal>
  )
}
