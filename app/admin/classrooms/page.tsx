import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { toggleClassroomActive } from './actions'

export default async function AdminClassroomsPage() {
  const classrooms = await prisma.classroom.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { bookings: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">教室管理</h1>
        <Link
          href="/admin/classrooms/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          新增教室
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">名稱</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">地點</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">容量</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">已預訂</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">狀態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {classrooms.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{c.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.location}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{c.capacity}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{c._count.bookings}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {c.isActive ? '啟用' : '停用'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/classrooms/${c.id}/edit`}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
                    >
                      編輯
                    </Link>
                    <form action={toggleClassroomActive.bind(null, c.id)}>
                      <button type="submit" className="text-gray-500 dark:text-gray-400 hover:underline text-xs">
                        {c.isActive ? '停用' : '啟用'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {classrooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  尚無教室，請點擊右上角新增。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
