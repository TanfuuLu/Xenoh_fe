import { API_BASE_URL } from './baseUrl'

const STATIC_ASSETS_URL = (
  (import.meta.env['VITE_STATIC_ASSETS_URL'] as string | undefined) ?? 'https://assets.xenoh.online'
).replace(/\/$/, '')

export function resolveStaticAssetUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null

  if (/^(https?:)?\/\//.test(imageUrl)) return imageUrl

  if (imageUrl.startsWith('/exercises-image/')) {
    return `${STATIC_ASSETS_URL}${imageUrl}`
  }

  return `${API_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`
}
