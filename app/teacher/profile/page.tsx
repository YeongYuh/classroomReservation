import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from './profile-form'
import { LineNotifySection } from './line-notify-section'

interface SearchParams { notify?: string }

export default async function TeacherProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { notify } = await searchParams

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      displayName: true,
      bio: true,
      avatarUrl: true,
      certUrls: true,
      youtubeUrl: true,
      lineNotifyToken: true,
    },
  })

  if (!profile) redirect('/login')

  const certUrls: string[] = (() => {
    try {
      const parsed = JSON.parse(profile.certUrls)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  const notifyBannerMap: Record<string, { msg: string; cls: string }> = {
    connected: { msg: 'LINE Notify 綁定成功！', cls: 'bg-green-50 border-green-200 text-green-800' },
    error:     { msg: 'LINE Notify 綁定失敗，請再試一次。', cls: 'bg-red-50 border-red-200 text-red-700' },
  }
  const notifyBanner = notify ? notifyBannerMap[notify] : null

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">個人檔案</h1>

      {notifyBanner && (
        <div className={`border rounded-xl px-4 py-3 text-sm mb-6 ${notifyBanner.cls}`}>
          {notifyBanner.msg}
        </div>
      )}

      <ProfileForm
        profile={{
          displayName: profile.displayName,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          certUrls,
          youtubeUrl: profile.youtubeUrl,
        }}
      />

      <div className="mt-8 border-t pt-8">
        <LineNotifySection connected={!!profile.lineNotifyToken} />
      </div>
    </div>
  )
}
