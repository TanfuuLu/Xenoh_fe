import { useState } from 'react'
import { Copy, Download, Image, Share2 } from 'lucide-react'
import { Modal } from '@/shared/components/Modal'
import { api } from '@/shared/api/axios'
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
      const { data: blob } = await api.get<Blob>(imageUrl, { responseType: 'blob' })
      const file = new File([blob], `xenoh-pr-${exerciseName}.png`, { type: 'image/png' })

      const shareData: ShareData = {
        title: `New ${exerciseName} PR! 🏆`,
        text:  `I just hit a new personal record on ${exerciseName}! Training with Xenoh.`,
        files: [file],
      }

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
      } else {
        await navigator.share({ title: shareData.title, text: shareData.text, url: sharePageUrl })
      }
      setShare('idle')
    } catch (err) {
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
      const { data: blob } = await api.get<Blob>(imageUrl, { responseType: 'blob' })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      flashCopy('img-copied')
    } catch {
      flashCopy('img-error')
    }
  }

  async function handleDownload() {
    const { data: blob } = await api.get<Blob>(imageUrl, { responseType: 'blob' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `xenoh-pr-${exerciseName.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors bg-[var(--bg-3)] text-[var(--fg-2)] hover:text-[var(--fg-1)]"
      >
        <Share2 size={14} />
        Share PR
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Share Achievement">
        <div className="space-y-3">
          {/* Card preview */}
          <div className="overflow-hidden rounded-xl border border-[var(--border-1)]">
            <img
              src={imageUrl}
              alt={`PR card for ${exerciseName}`}
              className="w-full object-cover aspect-[1200/630]"
            />
          </div>

          {/* Primary: native share (mobile-first) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={shareState === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 bg-[linear-gradient(135deg,var(--xn-clay-600),var(--xn-clay-800))]"
            >
              <Share2 size={16} />
              {shareState === 'loading' ? 'Preparing…' : shareState === 'error' ? 'Share failed — try again' : 'Share to Facebook / other apps'}
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[var(--border-1)]" />
            <span className="text-xs text-[var(--fg-4)]">or share via link</span>
            <div className="h-px flex-1 bg-[var(--border-1)]" />
          </div>

          {/* Social link buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={facebookShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 bg-[#1877f2]"
            >
              <FacebookIcon />
              Facebook
            </a>
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 bg-black"
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
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors bg-[var(--bg-3)]',
                copyState === 'img-copied' && 'text-[var(--xn-clay-700)]',
                copyState === 'img-error'  && 'text-[#ef4444]',
                copyState !== 'img-copied' && copyState !== 'img-error' && 'text-[var(--fg-2)]',
              )}
            >
              <Image size={14} />
              {copyState === 'img-copied' ? 'Copied!' : copyState === 'img-error' ? 'Failed' : 'Copy image'}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors bg-[var(--bg-3)]',
                copyState === 'link-copied' ? 'text-[var(--xn-clay-700)]' : 'text-[var(--fg-2)]',
              )}
            >
              <Copy size={14} />
              {copyState === 'link-copied' ? 'Copied!' : 'Copy link'}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors bg-[var(--bg-3)] text-[var(--fg-2)]"
            >
              <Download size={14} />
              Download
            </button>
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
