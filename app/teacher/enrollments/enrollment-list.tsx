'use client'

import { useState } from 'react'
import type { EnrollmentEntry } from '@/lib/enrollment-view'

interface CourseRow {
  id: string
  title: string
  startAt: string
  durationMin: number
  location: string
  maxSlots: number
  status: string
  paidCount: number
}

interface ApiResponse {
  courseId: string
  maxSlots: number
  paidCount: number
  isFull: boolean
  enrollments: EnrollmentEntry[]
}

const statusLabel: Record<string, string> = {
  PAID: '已付款',
  ATTENDED: '已出席',
  CANCELLED: '已取消',
  PENDING: '待付款',
}

export function EnrollmentList({ courses }: { courses: CourseRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [data, setData] = useState<Record<string, ApiResponse>>({})
  const [loading, setLoading] = useState<string | null>(null)

  async function toggle(courseId: string) {
    if (expanded === courseId) {
      setExpanded(null)
      return
    }
    setExpanded(courseId)
    if (data[courseId]) return

    setLoading(courseId)
    try {
      const res = await fetch(`/api/courses/${courseId}/enrollments`)
      if (res.ok) {
        const json = await res.json() as ApiResponse
        setData((prev) => ({ ...prev, [courseId]: json }))
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const isFull = course.paidCount >= course.maxSlots
        const isOpen = expanded === course.id
        const detail = data[course.id]
        const dateStr = new Date(course.startAt).toLocaleString('zh-TW', {
          timeZone: 'Asia/Taipei',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <div key={course.id} className="border rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggle(course.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 truncate">{course.title}</span>
                  {course.status === 'CANCELLED' && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">已取消</span>
                  )}
                  {isFull && course.status !== 'CANCELLED' && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">已額滿</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {dateStr} · {course.durationMin} 分鐘 · {course.location}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-sm text-gray-600 font-medium">
                  {course.paidCount} / {course.maxSlots}
                </span>
                <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t px-4 py-3 bg-gray-50">
                {loading === course.id ? (
                  <p className="text-sm text-gray-400 py-2">載入中...</p>
                ) : !detail ? (
                  <p className="text-sm text-red-400 py-2">載入失敗</p>
                ) : detail.enrollments.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">目前無人報名</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2 font-medium">學員</th>
                        <th className="pb-2 font-medium">狀態</th>
                        <th className="pb-2 font-medium">付款時間</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.enrollments.map((e) => (
                        <tr key={e.userId} className="py-1">
                          <td className="py-2 text-gray-800">{e.displayName}</td>
                          <td className="py-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {statusLabel[e.status] ?? e.status}
                            </span>
                          </td>
                          <td className="py-2 text-gray-500">
                            {e.paidAt
                              ? new Date(e.paidAt).toLocaleString('zh-TW', {
                                  timeZone: 'Asia/Taipei',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
