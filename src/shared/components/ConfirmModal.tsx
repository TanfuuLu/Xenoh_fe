import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ConfirmOptions {
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmState {
  open: boolean
  message: string
  options: ConfirmOptions
  resolve: ((yes: boolean) => void) | null
}

const DEFAULT: ConfirmState = { open: false, message: '', options: {}, resolve: null }

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(DEFAULT)

  const confirm = useCallback(
    (message: string, options: ConfirmOptions = {}): Promise<boolean> =>
      new Promise((resolve) => {
        setState({ open: true, message, options, resolve })
      }),
    [],
  )

  function handleYes() {
    state.resolve?.(true)
    setState(DEFAULT)
  }

  function handleNo() {
    state.resolve?.(false)
    setState(DEFAULT)
  }

  const danger = state.options.danger !== false
  const confirmLabel = state.options.confirmLabel ?? 'Confirm'
  const cancelLabel = state.options.cancelLabel ?? 'Cancel'

  const ConfirmDialog = (
    <AnimatePresence>
      {state.open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(58, 42, 30, 0.5)' }}
            onClick={handleNo}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.17, ease: 'easeOut' }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border-1)',
              }}
            >
              {/* Icon + message */}
              <div className="mb-5 flex items-start gap-3">
                {danger && (
                  <div
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--color-danger)' }}
                  >
                    <AlertTriangle size={17} />
                  </div>
                )}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--fg-1)', paddingTop: danger ? 6 : 0 }}
                >
                  {state.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={handleNo}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={danger ? 'danger' : 'primary'}
                  size="sm"
                  onClick={handleYes}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return { confirm, ConfirmDialog }
}
