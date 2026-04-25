'use client'

import type { HeatmapCell } from '@/lib/analytics'

interface Props {
  heatmap: HeatmapCell[]
  weekdayLabels: string[]
}

export default function HeatmapGrid({ heatmap, weekdayLabels }: Props) {
  const maxCount = Math.max(...heatmap.map((c) => c.count), 1)

  // Build lookup: weekday → hour → count
  const grid = Array.from({ length: 7 }, (_, w) =>
    Array.from({ length: 24 }, (_, h) => {
      const cell = heatmap.find((c) => c.weekday === w && c.hour === h)
      return cell?.count ?? 0
    }),
  )

  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
      <table className="border-collapse text-xs select-none">
        <thead>
          <tr>
            <th className="w-6" />
            {weekdayLabels.map((label, w) => (
              <th key={w} className="px-1 py-1 text-gray-500 font-normal text-center w-8">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 24 }, (_, h) => (
            <tr key={h}>
              <td className="pr-2 text-gray-400 text-right tabular-nums leading-none py-0.5">
                {String(h).padStart(2, '0')}
              </td>
              {grid.map((dayCol, w) => {
                const count = dayCol[h]
                const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 9)
                return (
                  <td
                    key={w}
                    title={count > 0 ? `${weekdayLabels[w]} ${h}:00 — ${count} 堂` : undefined}
                    className="w-8 h-5 rounded-sm"
                    style={{
                      backgroundColor:
                        count === 0
                          ? '#f3f4f6'
                          : `oklch(${55 + (9 - intensity) * 4}% 0.18 ${260 - intensity * 5})`,
                    }}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span>少</span>
        {[0, 3, 6, 9].map((i) => (
          <span
            key={i}
            className="w-4 h-4 rounded-sm inline-block"
            style={{
              backgroundColor:
                i === 0
                  ? '#f3f4f6'
                  : `oklch(${55 + (9 - i) * 4}% 0.18 ${260 - i * 5})`,
            }}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
