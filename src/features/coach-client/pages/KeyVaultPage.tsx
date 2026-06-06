import { useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, KeyRound, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useLangStore } from '@/shared/i18n'
import { useMyInviteCodes, useDeleteInviteCode } from '../index'
import { InviteCodeModal } from '../components/InviteCodeModal'

export function KeyVaultPage() {
  const lang = useLangStore((s) => s.lang)
  const tx = keyVaultText(lang)
  const shouldReduce = useReducedMotion()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const { data: inviteCodes, isLoading } = useMyInviteCodes()
  const { mutate: deleteInviteCode } = useDeleteInviteCode()

  const codes = inviteCodes ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-2">
          <Link to="/coach/clients">
            <Button variant="ghost" size="sm"><ChevronLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
              <KeyRound size={20} /> {tx.title}
            </h1>
            <p className="mt-1 text-sm text-muted">{tx.subtitle}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowInviteModal(true)}>
          <Plus size={14} /> {tx.create}
        </Button>
      </div>

      {/* Codes list */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {tx.sectionTitle} ({codes.length})
        </h2>

        {isLoading ? (
          <Card className="py-6 text-center text-sm text-muted">{tx.loading}</Card>
        ) : codes.length === 0 ? (
          <Card className="py-8 text-center text-sm text-muted">{tx.empty}</Card>
        ) : (
          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border-1)' }}
          >
            <AnimatePresence>
              {codes.map((code, idx) => {
                const isUsed = code.isUsed
                const isExpiredCode = !code.isUsed && new Date(code.coachingEndDate) < new Date()
                const statusLabel = isUsed ? tx.used : isExpiredCode ? tx.expired : tx.unused
                const statusColor = isUsed
                  ? 'var(--fg-3)'
                  : isExpiredCode
                    ? 'var(--color-warning)'
                    : 'var(--color-success)'
                return (
                  <motion.div
                    key={code.id}
                    variants={slideUp}
                    layout
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      background: idx % 2 === 0 ? 'var(--bg-2)' : 'var(--surface)',
                      borderTop: idx > 0 ? '1px solid var(--border-1)' : undefined,
                    }}
                  >
                    <span className="font-mono font-bold text-sm tracking-widest flex-1" style={{ color: 'var(--fg-1)' }}>
                      {code.code}
                    </span>
                    <span className="text-xs hidden sm:block" style={{ color: 'var(--fg-3)' }}>
                      {format(new Date(code.coachingStartDate), 'dd/MM/yy')} →{' '}
                      {format(new Date(code.coachingEndDate), 'dd/MM/yy')}
                    </span>
                    <span className="text-xs font-medium" style={{ color: statusColor }}>
                      {statusLabel}
                    </span>
                    {!isUsed && !isExpiredCode && (
                      <button
                        type="button"
                        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-danger)' }}
                        title={tx.delete}
                        onClick={() => deleteInviteCode(code.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {showInviteModal && <InviteCodeModal onClose={() => setShowInviteModal(false)} />}
    </div>
  )
}

function keyVaultText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      title: 'Key Vault',
      subtitle: 'Tạo và quản lý mã mời để client kết nối với bạn.',
      sectionTitle: 'Mã Coach',
      create: 'Tạo mã',
      loading: 'Đang tải...',
      empty: 'Chưa có mã Coach. Tạo mã để mời client kết nối.',
      used: 'Đã dùng',
      expired: 'Hết hạn',
      unused: 'Chưa dùng',
      delete: 'Xóa mã',
    }
    : {
      title: 'Key Vault',
      subtitle: 'Create and manage invite codes for clients to connect with you.',
      sectionTitle: 'Coach codes',
      create: 'Create code',
      loading: 'Loading...',
      empty: 'No coach codes yet. Create one to invite clients.',
      used: 'Used',
      expired: 'Expired',
      unused: 'Unused',
      delete: 'Delete code',
    }
}
