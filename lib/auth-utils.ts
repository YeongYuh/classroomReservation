import { Role } from '@prisma/client'

const PROTECTED_ROUTES: { prefix: string; role: Role }[] = [
  { prefix: '/admin', role: Role.ADMIN },
  { prefix: '/teacher', role: Role.TEACHER },
  { prefix: '/profile', role: Role.STUDENT },
  { prefix: '/messages', role: Role.STUDENT },
]

export function getRequiredRole(pathname: string): Role | null {
  const match = PROTECTED_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
  return match?.role ?? null
}

export function isRouteAllowed(pathname: string, userRole: Role | null): boolean {
  const required = getRequiredRole(pathname)
  if (required === null) return true        // public route
  if (userRole === null) return false       // not logged in

  if (required === Role.ADMIN) return userRole === Role.ADMIN
  if (required === Role.TEACHER) return userRole === Role.TEACHER
  // STUDENT required = any logged-in user
  return true
}
