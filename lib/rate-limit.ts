// Simple in-memory rate limiter.
// NOTE: state does not persist across serverless cold starts — use Upstash Redis
// for multi-instance production deployments.
type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

export function checkRateLimit(
  key: string,
  { maxAttempts = 10, windowMs = 15 * 60 * 1000 } = {},
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return { allowed: true, retryAfterSec: 0 }
  }

  entry.count++
  if (entry.count > maxAttempts) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSec: 0 }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
