import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.975 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, damping: 24, stiffness: 320, mass: 0.6 },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.975,
    transition: { duration: 0.1, ease: 'easeIn' as const },
  },
}

export function Select({ label, error, options, placeholder, value, onChange, disabled, className }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function pick(val: string) {
    onChange?.(val)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium"
          style={{ color: 'var(--fg-1)' }}
        >
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'xn-input flex items-center justify-between text-left transition-all',
          error && 'error',
          open && 'ring-2 ring-primary/30',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className={cn('truncate text-sm', !selected && 'text-muted')}>
          {selected?.label ?? placeholder ?? 'Select…'}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="ml-2 flex-shrink-0"
          style={{ color: 'var(--fg-3)' }}
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border"
            style={{
              background: 'var(--bg-3)',
              borderColor: 'var(--border-1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
              {placeholder && (
                <OptionRow
                  label={placeholder}
                  selected={!value || value === ''}
                  muted
                  onClick={() => pick('')}
                />
              )}
              {options.map((opt) => (
                <OptionRow
                  key={opt.value}
                  label={opt.label}
                  selected={opt.value === value}
                  onClick={() => pick(opt.value)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="text-xs"
            style={{ color: 'var(--xn-danger)' }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

interface OptionRowProps {
  label: string
  selected: boolean
  onClick: () => void
  muted?: boolean
}

function OptionRow({ label, selected, onClick, muted }: OptionRowProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors select-none',
        selected
          ? 'font-medium'
          : 'hover:bg-white/6',
        muted && !selected && 'text-muted',
      )}
      style={selected ? { background: 'var(--xn-clay-200)', color: 'var(--xn-clay-800)' } : undefined}
    >
      <span className="truncate">{label}</span>
      {selected && !muted && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15, ease: 'backOut' }}
          className="ml-2 flex-shrink-0"
          style={{ color: 'var(--xn-clay-800)' }}
        >
          <Check size={13} strokeWidth={2.5} />
        </motion.span>
      )}
    </div>
  )
}
