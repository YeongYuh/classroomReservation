export interface RawEnrollment {
  id: string
  status: string
  paidAt: Date | null
  user: { id: string; name: string | null; email: string }
}

export interface EnrollmentEntry {
  userId: string
  displayName: string
  status: string
  paidAt: string | null
}

export function buildEnrollmentView(rows: RawEnrollment[]): EnrollmentEntry[] {
  return rows.map(({ id: _id, user, status, paidAt }) => ({
    userId: user.id,
    displayName: user.name ?? user.id,
    status,
    paidAt: paidAt?.toISOString() ?? null,
  }))
}
