/**
 * Resolves which API base URL to use for the current session.
 *
 * Two URLs are kept side by side so the app works both locally and over the
 * internet via the Cloudflare Zero Trust tunnel:
 *   - localhost frontend  -> local API   (VITE_API_URL, e.g. https://localhost:7017)
 *   - any other hostname  -> public API  (VITE_API_URL_PUBLIC, e.g. https://api.xenoh.online)
 *
 * The choice is made once from window.location.hostname, since the hostname
 * the page is served from does not change during a session.
 */

const LOCAL_API_URL = ((import.meta.env['VITE_API_URL'] as string | undefined) ?? 'https://localhost:7017').replace(
  /\/$/,
  '',
)

const PUBLIC_API_URL = (
  (import.meta.env['VITE_API_URL_PUBLIC'] as string | undefined) ?? 'https://api.xenoh.online'
).replace(/\/$/, '')

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
}

export function resolveApiBaseUrl(): string {
  // Guard against non-browser contexts (tests, SSR): fall back to the local URL.
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return isLocalHost(hostname) ? LOCAL_API_URL : PUBLIC_API_URL
}

/** API base URL for the current session (no trailing slash). */
export const API_BASE_URL = resolveApiBaseUrl()
