interface ApiErrorShape {
  response?: {
    status?: number
    data?: { message?: string }
  }
}

/**
 * Extracts a human-readable message from an API error.
 *
 * Policy-based 403s (e.g. the RequireProCoach gate on creating exercises for a
 * client) and 401s come back with an empty body, so `response.data.message` is
 * undefined. Without a fallback the UI renders nothing and the action looks like
 * it failed silently. Callers pass a localized `fallback` (and optionally a
 * `forbidden` message for 403s) so every failure surfaces feedback.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  forbidden?: string,
): string {
  const apiError = error as ApiErrorShape | null
  const message = apiError?.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message
  if (forbidden && apiError?.response?.status === 403) return forbidden
  return fallback
}
