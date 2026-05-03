import { useEffect, useRef, useState } from 'react'
import { Copy, Check, Clock, RefreshCw, CheckCircle, QrCode, AlignJustify } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/utils/cn'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'
import { Spinner } from '@/shared/components/Spinner'
import { useSubscription, useRefreshSubscription } from '../api/useSubscription'
import { TIER_LABELS } from '../types'
import type { PaymentOrderResponse, PlanTier } from '../types'

// VietQR bank ID mapping — covers all major Vietnamese banks
const VIETQR_BANK_IDS: Record<string, string> = {
  mbbank: 'MB',
  mb: 'MB',
  techcombank: 'TCB',
  tcb: 'TCB',
  vietcombank: 'VCB',
  vcb: 'VCB',
  bidv: 'BIDV',
  vpbank: 'VPB',
  vpb: 'VPB',
  agribank: 'AGRIBANK',
  acb: 'ACB',
  sacombank: 'STB',
  stb: 'STB',
  tpbank: 'TPB',
  tpb: 'TPB',
  shb: 'SHB',
  hdbank: 'HDB',
  hdb: 'HDB',
  vib: 'VIB',
  msb: 'MSB',
  ocb: 'OCB',
  seabank: 'SEAB',
  ncb: 'NCB',
}

function getVietQrBankId(bankName: string): string {
  return VIETQR_BANK_IDS[bankName.toLowerCase().replace(/\s/g, '')] ?? bankName.toUpperCase()
}

function buildVietQrUrl(order: PaymentOrderResponse): string {
  const bankId = getVietQrBankId(order.bankName)
  const params = new URLSearchParams({
    amount: String(order.amount),
    addInfo: order.transferCode,
    accountName: order.bankAccountName,
  })
  return `https://img.vietqr.io/image/${bankId}-${order.bankAccountNumber}-qr_only.png?${params.toString()}`
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

// ── CopyField ─────────────────────────────────────────────────────────────────
function CopyField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium" style={{ color: 'var(--fg-3)' }}>{label}</span>
      <div
        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
        style={{
          background: highlight ? 'rgba(99,102,241,0.08)' : 'var(--bg-3)',
          border: `1px solid ${highlight ? 'var(--color-primary)' : 'var(--border-1)'}`,
        }}
      >
        <span className="text-sm font-mono truncate" style={{ color: 'var(--fg-1)', fontWeight: highlight ? 700 : 400 }}>
          {value}
        </span>
        <button
          onClick={() => void handleCopy()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22c55e' : 'var(--fg-3)', padding: 4, borderRadius: 4, flexShrink: 0 }}
          title="Copy"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

// ── QR tab ────────────────────────────────────────────────────────────────────
function QrTab({ order }: { order: PaymentOrderResponse }) {
  const [imgError, setImgError] = useState(false)
  const qrUrl = buildVietQrUrl(order)

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-center" style={{ color: 'var(--fg-3)' }}>
        Mở app ngân hàng → Quét mã QR. Thông tin chuyển khoản sẽ được điền tự động.
      </p>

      {imgError ? (
        <div
          className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-2xl text-sm"
          style={{ border: '1px dashed var(--border-1)', color: 'var(--fg-3)' }}
        >
          <QrCode size={32} />
          <span className="text-xs text-center px-4">Không tải được QR. Dùng tab Manual để chuyển khoản thủ công.</span>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden p-3" style={{ background: '#fff' }}>
          <img
            src={qrUrl}
            alt="VietQR payment QR code"
            width={200}
            height={200}
            onError={() => setImgError(true)}
            className="block"
          />
        </div>
      )}

      {/* Transfer description reminder */}
      <div className="w-full">
        <CopyField label="Nội dung chuyển khoản (bắt buộc)" value={order.transferCode} highlight />
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--fg-3)' }}>
        Nếu app ngân hàng không tự điền nội dung, hãy copy và điền thủ công.
      </p>
    </div>
  )
}

// ── Manual tab ────────────────────────────────────────────────────────────────
function ManualTab({ order }: { order: PaymentOrderResponse }) {
  return (
    <div className="flex flex-col gap-2.5">
      <CopyField label="Ngân hàng" value={order.bankName} />
      <CopyField label="Số tài khoản" value={order.bankAccountNumber} />
      <CopyField label="Tên tài khoản" value={order.bankAccountName} />
      <CopyField label="Số tiền (VND)" value={order.amount.toLocaleString('vi-VN')} />
      <CopyField label="Nội dung chuyển khoản (bắt buộc)" value={order.transferCode} highlight />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  order: PaymentOrderResponse | null
  onClose: () => void
}

type Tab = 'qr' | 'manual'

export function PaymentOrderModal({ order, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('qr')
  const [checking, setChecking] = useState(false)
  const [activated, setActivated] = useState(false)
  const prevTierRef = useRef<PlanTier | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: subscription, refetch } = useSubscription()
  const refreshSubscription = useRefreshSubscription()

  // Capture tier when modal opens
  useEffect(() => {
    if (order && subscription) {
      prevTierRef.current = subscription.tier
    }
  }, [order, subscription])

  // Auto-poll every 15s
  useEffect(() => {
    if (!order) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      const result = await refetch()
      const newTier = result.data?.tier
      if (newTier && prevTierRef.current && newTier !== prevTierRef.current) {
        clearInterval(pollRef.current!)
        setActivated(true)
        toast.success('🎉 Đã kích hoạt subscription!', {
          description: `Bạn đang dùng ${TIER_LABELS[newTier]}.`,
          duration: 6000,
        })
      }
    }, 15_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [order, refetch])

  async function handleCheckStatus() {
    setChecking(true)
    try {
      const result = await refetch()
      const newTier = result.data?.tier
      if (newTier && prevTierRef.current && newTier !== prevTierRef.current) {
        setActivated(true)
        toast.success('🎉 Đã kích hoạt subscription!', {
          description: `Bạn đang dùng ${TIER_LABELS[newTier]}.`,
          duration: 6000,
        })
      } else {
        toast.info('Chưa xác nhận thanh toán', {
          description: 'SePay đang xử lý. Thử lại sau vài giây.',
        })
      }
    } finally {
      setChecking(false)
    }
  }

  function handleClose() {
    refreshSubscription()
    setActivated(false)
    setTab('qr')
    prevTierRef.current = null
    onClose()
  }

  if (!order) return null

  const tierLabel = TIER_LABELS[order.requestedTier] ?? order.requestedTier
  const isExpired = new Date(order.expiresAt) < new Date()

  return (
    <Modal
      open={!!order}
      onClose={handleClose}
      title={activated ? 'Thanh toán thành công 🎉' : 'Hoàn tất thanh toán'}
      className="max-w-sm"
    >
      <AnimatePresence mode="wait">
        {/* ── Success state ── */}
        {activated && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-4 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(34,197,94,0.12)' }}>
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--fg-1)' }}>Chào mừng đến {tierLabel}!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>
                Subscription của bạn đã được kích hoạt.
                {subscription?.expiresAt && <> Hết hạn {format(new Date(subscription.expiresAt), 'dd/MM/yyyy')}.</>}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">Bắt đầu dùng Pro</Button>
          </motion.div>
        )}

        {/* ── Payment instructions ── */}
        {!activated && (
          <motion.div key="instructions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">

            {/* Amount */}
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--fg-3)' }}>
                {tierLabel} · {order.durationMonths} tháng
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--fg-1)' }}>{formatVnd(order.amount)}</p>
            </div>

            {/* Tab toggle */}
            <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--bg-2)' }}>
              {([['qr', QrCode, 'QR Code'], ['manual', AlignJustify, 'Manual']] as const).map(([t, Icon, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
                    tab === t ? 'text-white shadow-sm' : 'text-[var(--fg-3)]',
                  )}
                  style={tab === t ? { background: 'var(--color-primary)', border: 'none', cursor: 'pointer' } : { background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {tab === 'qr' ? <QrTab order={order} /> : <ManualTab order={order} />}
              </motion.div>
            </AnimatePresence>

            {/* Expiry */}
            {isExpired ? (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Clock size={13} className="shrink-0" />
                Order đã hết hạn. Đóng và tạo lại.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-3)', color: 'var(--fg-3)' }}>
                <Clock size={13} className="shrink-0" />
                Hết hạn {formatDistanceToNow(new Date(order.expiresAt), { addSuffix: true })} · {format(new Date(order.expiresAt), 'HH:mm dd/MM/yyyy')}
              </div>
            )}

            {/* Polling notice */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg-3)', color: 'var(--fg-3)' }}>
              <Spinner size="sm" />
              Tự động kiểm tra trạng thái mỗi 15 giây…
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button onClick={() => void handleCheckStatus()} loading={checking} variant="secondary" className="w-full gap-2">
                <RefreshCw size={14} />
                Kiểm tra ngay
              </Button>
              <Button variant="ghost" onClick={handleClose} className="w-full text-sm">
                Để sau
              </Button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
