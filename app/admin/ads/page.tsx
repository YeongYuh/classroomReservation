import { prisma } from '@/lib/prisma'
import { AdSlot } from '@prisma/client'
import { createAd, toggleAdActive } from './actions'

const SLOT_LABELS: Record<AdSlot, string> = {
  HOMEPAGE_BANNER: '首頁橫幅',
  FEATURED_TEACHER: '推薦老師',
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

export default async function AdminAdsPage() {
  const ads = await prisma.advertisement.findMany({
    orderBy: { startAt: 'desc' },
  })

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">廣告管理</h1>

      {/* ── Create form ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">新增廣告</h2>
        <form
          action={createAd}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label className={labelCls}>版位</label>
            <select name="slot" className={inputCls}>
              {Object.values(AdSlot).map((s) => (
                <option key={s} value={s}>
                  {SLOT_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>圖片 URL（Cloudinary）</label>
            <input
              name="imageUrl"
              required
              placeholder="https://res.cloudinary.com/..."
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>連結 URL（選填）</label>
            <input
              name="linkUrl"
              placeholder="https://..."
              className={inputCls}
            />
          </div>

          <div />

          <div>
            <label className={labelCls}>開始日期</label>
            <input
              name="startAt"
              type="datetime-local"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>結束日期</label>
            <input
              name="endAt"
              type="datetime-local"
              required
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              新增廣告
            </button>
          </div>
        </form>
      </section>

      {/* ── Existing ads ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          廣告列表{' '}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({ads.length})</span>
        </h2>

        {ads.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm">尚無廣告</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">版位</th>
                  <th className="px-4 py-3 text-left">圖片</th>
                  <th className="px-4 py-3 text-left">期間</th>
                  <th className="px-4 py-3 text-left">狀態</th>
                  <th className="px-4 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{SLOT_LABELS[ad.slot]}</td>
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ad.imageUrl} alt="" className="h-10 w-20 object-cover rounded" />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      <div>{ad.startAt.toLocaleDateString('zh-TW')}</div>
                      <div>~ {ad.endAt.toLocaleDateString('zh-TW')}</div>
                    </td>
                    <td className="px-4 py-3">
                      {ad.isActive ? (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">啟用</span>
                      ) : (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">停用</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleAdActive}>
                        <input type="hidden" name="id" value={ad.id} />
                        <input type="hidden" name="active" value={String(!ad.isActive)} />
                        <button
                          type="submit"
                          className={`text-xs px-3 py-1 rounded border transition-colors ${
                            ad.isActive
                              ? 'border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          {ad.isActive ? '停用' : '啟用'}
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
    </div>
  )
}
