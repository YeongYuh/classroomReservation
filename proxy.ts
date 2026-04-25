import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isRouteAllowed } from '@/lib/auth-utils'
import { Role } from '@prisma/client'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for static assets and NextAuth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const session = await auth()
  const userRole = (session?.user?.role as Role) ?? null

  if (!isRouteAllowed(pathname, userRole)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
