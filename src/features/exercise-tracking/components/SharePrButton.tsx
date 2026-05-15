import { useState } from 'react'
import { Copy, Download, Image, Share2 } from 'lucide-react'
import { Modal } from '@/shared/components/Modal'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { cn } from '@/shared/utils/cn'

const API_BASE = (import.meta.env['VITE_API_URL'] as string) ?? ''

interface Props {
  userId: string
  exerciseTemplateId: string
  exerciseName: string
}

type CopyState = 'idle' | 'link-copied' | 'img-copied' | 'img-error'
type ShareState = 'idle' | 'loading' | 'error'

export function SharePrButton({ userId, exerciseTemplateId, exerciseName }: Props) {
  const [open, setOpen]         = useState(false)
  const [copyState, setCopy]    = useState<CopyState>('idle')
  const [shareState, setShare]  = useState<ShareState>('idle')

  const imageUrl     = `${API_BASE}${ENDPOINTS.share.prImage(userId, exerciseTemplateId)}`
  const sharePageUrl = `${API_BASE}${ENDPOINTS.share.prPage(userId, exerciseTemplateId)}`

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  const facebookShareUrl =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePageUrl)}`
  const twitterShareUrl =
    `https://twitter.com/intent/tweet` +
    `?text=${encodeURIComponent(`I just hit a new PR on ${exerciseName}! 🏆`)}` +
    `&url=${encodeURIComponent(sharePageUrl)}`

  function flashCopy(state: CopyState) {
    setCopy(state)
    setTimeout(() => setCopy('idle'), 2200)
  }

  async function handleNativeShare() {
    setShare('loading')
    try {
      const res  = await fetch(imageUrl)
      const blob = await res.blob()
      const file = new File([blob], `xenoh-pr-${exerciseName}.png`, { type: 'image/png' })

      const shareData: ShareData = {
        title: `New ${exerciseName} PR! 🏆`,
        text:  `I just hit a new personal record on ${exerciseName}! Training with Xenoh.`,
        files: [file],
      }

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
      } else {
        // Files not supported — share link only
        await navigator.share({ title: shareData.title, text: shareData.text, url: sharePageUrl })
      }
      setShare('idle')
    } catch (err) {
      // AbortError = user dismissed — not a real error
      if (err instanceof Error && err.name !== 'AbortError') setShare('error')
      else setShare('idle')
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(sharePageUrl)
    flashCopy('link-copied')
  }

  async function handleCopyImage() {
    try {
      const res  = await fetch(imageUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      flashCopy('img-copied')
    } catch {
      flashCopy('img-error')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors')}
        style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-1)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-2)' }}
      >
        <Share2 size={14} />
        Share PR
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Share Achievement">
        <div className="space-y-3">
          {/* Card preview */}
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-1)' }}>
            <img
              src={imageUrl}
              alt={`PR card for ${exerciseName}`}
              className="w-full object-cover"
              style={{ aspectRatio: '1200/630' }}
            />
          </div>

          {/* Primary: native share (mobile-first — opens Facebook with image attached) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={shareState === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--xn-clay-600), var(--xn-clay-800))' }}
            >
              <Share2 size={16} />
              {shareState === 'loading' ? 'Preparing…' : shareState === 'error' ? 'Share failed — try again' : 'Share to Facebook / other apps'}
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: 'var(--border-1)' }} />
            <span className="text-xs" style={{ color: 'var(--fg-4)' }}>or share via link</span>
            <div className="h-px flex-1" style={{ background: 'var(--border-1)' }} />
          </div>

          {/* Social link buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={facebookShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: '#1877f2' }}
            >
              <FacebookIcon />
              Facebook
            </a>
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: '#000' }}
            >
              <XIcon />
              X / Twitter
            </a>
          </div>

          {/* Utility buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: 'var(--bg-3)',
                color: copyState === 'img-copied' ? 'var(--xn-clay-700)'
                     : copyState === 'img-error'  ? '#ef4444'
                     : 'var(--fg-2)',
              }}
            >
              <Image size={14} />
              {copyState === 'img-copied' ? 'Copied!' : copyState === 'img-error' ? 'Failed' : 'Copy image'}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-3)', color: copyState === 'link-copied' ? 'var(--xn-clay-700)' : 'var(--fg-2)' }}
            >
              <Copy size={14} />
              {copyState === 'link-copied' ? 'Copied!' : 'Copy link'}
            </button>

            <a
              href={imageUrl}
              download={`xenoh-pr-${exerciseName.replace(/\s+/g, '-').toLowerCase()}.png`}
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
            >
              <Download size={14} />
              Download
            </a>
          </div>
        </div>
      </Modal>
    </>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.884v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}
