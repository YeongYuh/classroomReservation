import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { updateTeacher } from '../../actions'
import Link from 'next/link'

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: id },
    select: { displayName: true, bio: true, user: { select: { email: true } } },
  })
  if (!teacher) notFound()

  async function action(formData: FormData) {
    'use server'
    await updateTeacher(id, formData)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">編輯老師</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{teacher.user.email}</p>

      <form action={action} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">顯示名稱 *</label>
          <input
            name="displayName"
            required
            defaultValue={teacher.displayName}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">簡介</label>
          <textarea
            name="bio"
            rows={4}
            defaultValue={teacher.bio ?? ''}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            儲存
          </button>
          <Link href="/admin/teachers" className="px-5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            取消
          </Link>
        </div>
      </form>
    </div>
  )
}
