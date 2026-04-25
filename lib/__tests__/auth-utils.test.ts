import { describe, it, expect } from 'vitest'
import { getRequiredRole, isRouteAllowed } from '../auth-utils'
import { Role } from '@prisma/client'

describe('getRequiredRole', () => {
  it('returns TEACHER for /teacher/* routes', () => {
    expect(getRequiredRole('/teacher/schedule')).toBe(Role.TEACHER)
    expect(getRequiredRole('/teacher')).toBe(Role.TEACHER)
  })

  it('returns ADMIN for /admin/* routes', () => {
    expect(getRequiredRole('/admin/dashboard')).toBe(Role.ADMIN)
    expect(getRequiredRole('/admin')).toBe(Role.ADMIN)
  })

  it('returns STUDENT (any logged-in) for /profile/* routes', () => {
    expect(getRequiredRole('/profile')).toBe(Role.STUDENT)
    expect(getRequiredRole('/profile/courses')).toBe(Role.STUDENT)
  })

  it('returns null for public routes', () => {
    expect(getRequiredRole('/')).toBeNull()
    expect(getRequiredRole('/teachers/abc')).toBeNull()
    expect(getRequiredRole('/courses/xyz')).toBeNull()
    expect(getRequiredRole('/login')).toBeNull()
  })
})

describe('isRouteAllowed', () => {
  it('allows TEACHER to access /teacher routes', () => {
    expect(isRouteAllowed('/teacher/schedule', Role.TEACHER)).toBe(true)
  })

  it('blocks STUDENT from /teacher routes', () => {
    expect(isRouteAllowed('/teacher/schedule', Role.STUDENT)).toBe(false)
  })

  it('blocks TEACHER from /admin routes', () => {
    expect(isRouteAllowed('/admin/dashboard', Role.TEACHER)).toBe(false)
  })

  it('allows ADMIN to access /admin routes', () => {
    expect(isRouteAllowed('/admin/dashboard', Role.ADMIN)).toBe(true)
  })

  it('allows any logged-in user to access /profile', () => {
    expect(isRouteAllowed('/profile', Role.STUDENT)).toBe(true)
    expect(isRouteAllowed('/profile', Role.TEACHER)).toBe(true)
    expect(isRouteAllowed('/profile', Role.ADMIN)).toBe(true)
  })

  it('allows unauthenticated access to public routes', () => {
    expect(isRouteAllowed('/', null)).toBe(true)
    expect(isRouteAllowed('/login', null)).toBe(true)
  })

  it('blocks unauthenticated access to protected routes', () => {
    expect(isRouteAllowed('/teacher/schedule', null)).toBe(false)
    expect(isRouteAllowed('/admin', null)).toBe(false)
    expect(isRouteAllowed('/profile', null)).toBe(false)
  })
})
