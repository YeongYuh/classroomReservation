'use client'

import { useState } from 'react'
import Link from 'next/link'

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

interface OpenHour {
  day: number
  open: string
  close: string
}

interface Props {
  action: (formData: FormData) => Promise<{ error: string } | void>
  defaultValues?: {
    name?: string
    capacity?: number
    location?: string
    openHours?: OpenHour[]
  }
}

export function ClassroomForm({ action, defaultValues }: Props) {
  const [openHours, setOpenHours] = useState<OpenHour[]>(defaultValues?.openHours ?? [])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const toggleDay = (day: number) => {
    setOpenHours((prev) => {
      if (prev.find((h) => h.day === day)) {
        return prev.filter((h) => h.day !== day)
      }
      return [...prev, { day, open: '08:00', close: '22:00' }].sort((a, b) => a.day - b.day)
    })
  }

  const updateHour = (day: number, field: 'open' | 'close', value: string) => {
    setOpenHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: value } : h)),
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('openHours', JSON.stringify(openHours))
    const result = await action(fd)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">教室名稱</label>
        <input
          name="name"
          defaultValue={defaultValues?.name}
          required
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">容量（人）</label>
          <input
            name="capacity"
            type="number"
            min={1}
            max={500}
            defaultValue={defaultValues?.capacity}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">地點</label>
          <input
            name="location"
            defaultValue={defaultValues?.location}
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">開放時段</label>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const hour = openHours.find((h) => h.day === day)
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                    hour
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {DAY_NAMES[day]}
                </button>
                {hour && (
                  <>
                    <input
                      type="time"
                      value={hour.open}
                      onChange={(e) => updateHour(day, 'open', e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <span className="text-gray-400 text-sm">至</span>
                    <input
                      type="time"
                      value={hour.close}
                      onChange={(e) => updateHour(day, 'close', e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {pending ? '儲存中…' : '儲存'}
        </button>
        <Link href="/admin/classrooms" className="px-5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          取消
        </Link>
      </div>
    </form>
  )
}
