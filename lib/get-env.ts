/**
 * Reads a required environment variable. Throws at call time if absent or empty,
 * so misconfigured deployments fail loudly instead of silently using fallbacks.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Required environment variable "${name}" is not set`)
  return value
}
