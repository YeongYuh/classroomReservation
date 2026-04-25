export function canTeacherAccessDashboard(profile: { isVerified: boolean } | null): boolean {
  return profile?.isVerified === true
}
