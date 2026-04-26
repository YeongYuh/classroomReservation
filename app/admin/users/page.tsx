import { prisma } from '@/lib/prisma'
import { Role, UserStatus } from '@prisma/client'
import Link from 'next/link'
import { DeleteUserButton } from './delete-button'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: '管理員',
  TEACHER: '老師',
  STUDENT: '學員',
}

const STATUS_LABELS: Record<UserStatus, string> = {
  PENDING: '待審核',
  ACTIVE: '啟用',
  SUSPENDED: '停用',
}

const STATUS_COLORS: Record<UserStatus, string> = {
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  SUSPENDED: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

interface PageProps {
  searchParams: Promise<{ created?: string; tempPassword?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const users = await prisma.user.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  const pendingCount = users.filter((u) => u.status === UserStatus.PENDING).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          人員管理
          {pendingCount > 0 && (
            <span className="ml-3 text-sm font-normal bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
              {pendingCount} 人待審核
            </span>
          )}
        </h1>
        <Link
          href="/admin/users/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + 新增人員
        </Link>
      </div>

      {params.created && params.tempPassword && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-700 dark:text-green-400">
          人員已建立！臨時密碼（僅顯示一次）：
          <span className="font-mono font-bold ml-2">{params.tempPassword}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">姓名 / Email</th>
              <th className="px-4 py-3 text-left">身分</th>
              <th className="px-4 py-3 text-left">狀態</th>
              <th className="px-4 py-3 text-left">加入日期</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{user.name ?? '—'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ROLE_LABELS[user.role]}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[user.status]}`}>
                    {STATUS_LABELS[user.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  {user.createdAt.toLocaleDateString('zh-TW')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="text-xs px-3 py-1 rounded border border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      編輯
                    </Link>
                    <DeleteUserButton id={user.id} label={user.name ?? user.email} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">尚無人員資料</p>
        )}
      </div>
    </div>
  )
}
