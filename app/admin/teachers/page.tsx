import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { approveTeacher, setTeacherHidden, updateCommission, deleteTeacher } from './actions'

export default async function AdminTeachersPage() {
  const [pendingTeachers, allTeachers] = await Promise.all([
    prisma.teacherProfile.findMany({
      where: { isVerified: false },
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true } },
      },
      orderBy: { user: { createdAt: 'desc' } },
    }),
    prisma.teacherProfile.findMany({
      where: { isVerified: true },
      include: {
        user: { select: { id: true, email: true, name: true } },
        commission: { select: { plan: true, rate: true } },
        _count: { select: { courses: true } },
      },
      orderBy: { displayName: 'asc' },
    }),
  ])

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">老師管理</h1>
        <Link
          href="/admin/teachers/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + 新增老師
        </Link>
      </div>

      {/* ── Pending verification ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          待審核{' '}
          <span className="text-sm font-normal text-gray-500">({pendingTeachers.length})</span>
        </h2>

        {pendingTeachers.length === 0 ? (
          <p className="text-gray-400 text-sm">目前無待審核老師</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">姓名</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">申請時間</th>
                  <th className="px-4 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pendingTeachers.map((tp) => (
                  <tr key={tp.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{tp.displayName}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{tp.user.email}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {tp.user.createdAt.toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <form action={approveTeacher}>
                          <input type="hidden" name="userId" value={tp.userId} />
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            審核通過
                          </button>
                        </form>
                        <Link
                          href={`/admin/teachers/${tp.userId}/edit`}
                          className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          編輯
                        </Link>
                        <form action={deleteTeacher.bind(null, tp.userId)} onSubmit={(e) => { if (!confirm(`確定要刪除 ${tp.displayName}？此操作無法還原。`)) e.preventDefault() }}>
                          <button type="submit" className="border border-red-300 text-red-500 px-3 py-1 rounded text-xs hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            刪除
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Active teachers ────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          已審核老師{' '}
          <span className="text-sm font-normal text-gray-500">({allTeachers.length})</span>
        </h2>

        {allTeachers.length === 0 ? (
          <p className="text-gray-400 text-sm">尚無已審核老師</p>
        ) : (
          <div className="space-y-3">
            {allTeachers.map((tp) => {
              const commission = tp.commission
              const currentPlan = commission?.plan ?? 'PERCENTAGE'
              const currentRate = commission ? Number(commission.rate) : 0.15

              return (
                <div key={tp.userId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{tp.displayName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{tp.user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tp._count.courses} 堂課程</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/teachers/${tp.userId}/report`}
                        className="text-xs text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-800 dark:hover:text-indigo-300"
                      >
                        月結報表
                      </Link>
                      <Link
                        href={`/admin/teachers/${tp.userId}/edit`}
                        className="text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-2.5 py-0.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        編輯
                      </Link>

                      {tp.isHidden ? (
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">已停權</span>
                      ) : (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">正常</span>
                      )}

                      <form action={setTeacherHidden}>
                        <input type="hidden" name="userId" value={tp.userId} />
                        <input type="hidden" name="hidden" value={String(!tp.isHidden)} />
                        <button
                          type="submit"
                          className={`text-xs px-2.5 py-0.5 rounded border transition-colors ${
                            tp.isHidden
                              ? 'border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              : 'border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                        >
                          {tp.isHidden ? '恢復上架' : '停權'}
                        </button>
                      </form>

                      <form
                        action={deleteTeacher.bind(null, tp.userId)}
                        onSubmit={(e) => { if (!confirm(`確定要刪除 ${tp.displayName}？所有課程與預約資料將一併刪除，此操作無法還原。`)) e.preventDefault() }}
                      >
                        <button type="submit" className="text-xs border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 px-2.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          刪除
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Commission settings */}
                  <form action={updateCommission} className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-wrap">
                    <input type="hidden" name="userId" value={tp.userId} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">分潤方案：</span>

                    <select
                      name="plan"
                      defaultValue={currentPlan}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="PERCENTAGE">百分比</option>
                      <option value="MONTHLY">月費</option>
                    </select>

                    <input
                      type="number"
                      name="rate"
                      defaultValue={currentRate}
                      step="0.01"
                      min="0"
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />

                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {currentPlan === 'PERCENTAGE' ? '(0–1，如 0.15 = 15%)' : '(NT$/月)'}
                    </span>

                    <button
                      type="submit"
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                    >
                      儲存
                    </button>

                    {commission && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                        目前：{commission.plan === 'PERCENTAGE'
                          ? `${(Number(commission.rate) * 100).toFixed(0)}%`
                          : `NT$ ${Number(commission.rate).toLocaleString()}/月`}
                      </span>
                    )}
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
