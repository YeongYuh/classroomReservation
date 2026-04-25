/**
 * Validates that a URL uses http: or https:. Throws if the value is not a
 * valid URL or uses any other scheme (e.g. javascript:, data:).
 */
export function requireHttpUrl(value: string, field: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${field} 不是有效的 URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${field} 必須使用 http 或 https`)
  }
  return value
}
