import { prisma } from '@/lib/prisma'
import { Role, UserStatus } from '@prisma/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateUser } from '../../actions'

const ROLE_LABELS: Record<Role, string> = { ADMIN: '管理員', TEACHER: '老師', STUDENT: '學員' }
const STATUS_LABELS: Record<UserStatus, string> = { PENDING: '待審核', ACTIVE: '啟用', SUSPENDED: '停用' }

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, status: true },
  })
  if (!user) notFound()

  async function action(formData: FormData) {
    'use server'
    await updateUser(formData)
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-sm text-gray-500 dark:text-gray-400 hover:underline">← 返回</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">編輯人員</h1>
      </div>

      <form action={action} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <input type="hidden" name="id" value={user.id} />

        <div>
          <label className={labelCls}>Email（不可修改）</label>
          <p className="text-sm text-gray-700 dark:text-gray-300 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">{user.email}</p>
        </div>

        <div>
          <label className={labelCls}>姓名</label>
          <input name="name" type="text" required defaultValue={user.name ?? ''} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>身分</label>
          <select name="role" defaultValue={user.role} className={inputCls}>
            {Object.values(Role).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>狀態</label>
          <select name="status" defaultValue={user.status} className={inputCls}>
            {Object.values(UserStatus).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          儲存變更
        </button>
      </form>
    </div>
  )
}
