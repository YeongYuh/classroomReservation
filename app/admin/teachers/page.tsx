import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { approveTeacher, setTeacherHidden, updateCommission } from './actions'

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
      <h1 className="text-2xl font-bold">老師管理</h1>

      {/* ── Pending verification ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          待審核{' '}
          <span className="text-sm font-normal text-gray-500">({pendingTeachers.length})</span>
        </h2>

        {pendingTeachers.length === 0 ? (
          <p className="text-gray-400 text-sm">目前無待審核老師</p>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">姓名</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">申請時間</th>
                  <th className="px-4 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingTeachers.map((tp) => (
                  <tr key={tp.userId}>
                    <td className="px-4 py-3 font-medium">{tp.displayName}</td>
                    <td className="px-4 py-3 text-gray-500">{tp.user.email}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {tp.user.createdAt.toLocaleDateString('zh-TW')}
                    </td>
                    <td className="px-4 py-3">
                      <form action={approveTeacher}>
                        <input type="hidden" name="userId" value={tp.userId} />
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          審核通過
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Active teachers: suspend + commission ────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
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
                <div key={tp.userId} className="bg-white rounded-xl shadow p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800">{tp.displayName}</p>
                      <p className="text-sm text-gray-500">{tp.user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tp._count.courses} 堂課程</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/teachers/${tp.userId}/report`}
                        className="text-xs text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
                      >
                        月結報表
                      </Link>
                      {tp.isHidden ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">已停權</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">正常</span>
                      )}

                      <form action={setTeacherHidden}>
                        <input type="hidden" name="userId" value={tp.userId} />
                        <input type="hidden" name="hidden" value={String(!tp.isHidden)} />
                        <button
                          type="submit"
                          className={`text-xs px-3 py-1 rounded border transition-colors ${
                            tp.isHidden
                              ? 'border-green-400 text-green-600 hover:bg-green-50'
                              : 'border-red-400 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {tp.isHidden ? '恢復上架' : '停權'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Commission settings */}
                  <form action={updateCommission} className="mt-3 pt-3 border-t flex items-center gap-3 flex-wrap">
                    <input type="hidden" name="userId" value={tp.userId} />
                    <span className="text-xs text-gray-500">分潤方案：</span>

                    <select
                      name="plan"
                      defaultValue={currentPlan}
                      className="text-xs border rounded px-2 py-1 bg-white"
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
                      className="text-xs border rounded px-2 py-1 w-24"
                      placeholder={currentPlan === 'PERCENTAGE' ? '0.15' : '500'}
                    />

                    <span className="text-xs text-gray-400">
                      {currentPlan === 'PERCENTAGE' ? '(0–1，如 0.15 = 15%)' : '(NT$/月)'}
                    </span>

                    <button
                      type="submit"
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                    >
                      儲存
                    </button>

                    {commission && (
                      <span className="text-xs text-gray-400 ml-1">
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
