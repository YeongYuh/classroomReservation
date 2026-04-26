'use client'

import { useEffect, useState } from 'react'
import type { HeatmapCell } from '@/lib/analytics'

interface Props {
  heatmap: HeatmapCell[]
  weekdayLabels: string[]
}

export default function HeatmapGrid({ heatmap, weekdayLabels }: Props) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const maxCount = Math.max(...heatmap.map((c) => c.count), 1)
  const emptyColor = isDark ? '#374151' : '#f3f4f6' // gray-700 : gray-100

  const grid = Array.from({ length: 7 }, (_, w) =>
    Array.from({ length: 24 }, (_, h) => {
      const cell = heatmap.find((c) => c.weekday === w && c.hour === h)
      return cell?.count ?? 0
    }),
  )

  function cellColor(count: number) {
    if (count === 0) return emptyColor
    const intensity = Math.ceil((count / maxCount) * 9)
    return `oklch(${55 + (9 - intensity) * 4}% 0.18 ${260 - intensity * 5})`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-x-auto">
      <table className="border-collapse text-xs select-none">
        <thead>
          <tr>
            <th className="w-6" />
            {weekdayLabels.map((label, w) => (
              <th key={w} className="px-1 py-1 text-gray-500 dark:text-gray-400 font-normal text-center w-8">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 24 }, (_, h) => (
            <tr key={h}>
              <td className="pr-2 text-gray-400 dark:text-gray-500 text-right tabular-nums leading-none py-0.5">
                {String(h).padStart(2, '0')}
              </td>
              {grid.map((dayCol, w) => {
                const count = dayCol[h]
                return (
                  <td
                    key={w}
                    title={count > 0 ? `${weekdayLabels[w]} ${h}:00 — ${count} 堂` : undefined}
                    className="w-8 h-5 rounded-sm"
                    style={{ backgroundColor: cellColor(count) }}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
        <span>少</span>
        {[0, 3, 6, 9].map((i) => (
          <span
            key={i}
            className="w-4 h-4 rounded-sm inline-block"
            style={{ backgroundColor: i === 0 ? emptyColor : `oklch(${55 + (9 - i) * 4}% 0.18 ${260 - i * 5})` }}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
