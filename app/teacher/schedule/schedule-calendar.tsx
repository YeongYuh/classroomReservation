'use client'

import { useState, useTransition, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse, cancelCourse } from './actions'

interface Course {
  id: string
  title: string
  tags: string[]
  location: string
  startAt: string
  durationMin: number
  maxSlots: number
  price: string
  status: string
  _count: { reservations: number }
}

interface Props {
  courses: Course[]
}

const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function buildCalendarWeeks(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = firstDay.getDay()
  const days: (Date | null)[] = [
    ...Array<null>(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (days.length % 7 !== 0) days.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function toDatetimeLocal(date: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T09:00`
}

function isToday(d: Date) {
  return isSameDate(d, new Date())
}

export function ScheduleCalendar({ courses }: Props) {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showModal, setShowModal] = useState(false)
  const [modalDate, setModalDate] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [isPending, startTransition] = useTransition()

  const weeks = buildCalendarWeeks(year, month)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function openModal(date?: Date) {
    const d = date ?? new Date(Date.now() + 86400000)
    setModalDate(toDatetimeLocal(d))
    setTags([])
    setTagInput('')
    setFormError('')
    setShowModal(true)
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim()
      if (val && !tags.includes(val)) setTags(prev => [...prev, val])
      setTagInput('')
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')
    const fd = new FormData(e.currentTarget)
    fd.set('tags', JSON.stringify(tags))
    startTransition(async () => {
      try {
        await createCourse(fd)
        setShowModal(false)
        router.refresh()
      } catch (err) {
        setFormError(err instanceof Error ? err.message : '建立失敗')
      }
    })
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelCourse(id)
      setConfirmCancelId(null)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-100 text-gray-600">‹</button>
          <h2 className="text-lg font-semibold w-24 text-center">{year} {MONTH_LABELS[month]}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-100 text-gray-600">›</button>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + 新增課程
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b">
          {DOW_LABELS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x border-b last:border-b-0">
            {week.map((day, di) => {
              const dayCourses = day
                ? courses.filter(c => isSameDate(new Date(c.startAt), day))
                : []
              return (
                <div
                  key={di}
                  className={`min-h-[90px] p-1.5 ${day ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50/50'}`}
                  onClick={() => day && openModal(day)}
                >
                  {day && (
                    <>
                      <p className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                        {day.getDate()}
                      </p>
                      <div className="space-y-0.5">
                        {dayCourses.map(c => (
                          <div
                            key={c.id}
                            onClick={e => { e.stopPropagation(); setConfirmCancelId(c.id) }}
                            className={`px-1.5 py-0.5 rounded text-xs truncate cursor-pointer ${c.status === 'CANCELLED' ? 'bg-gray-100 text-gray-400 line-through' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'}`}
                            title={`${c.title} — 點擊管理`}
                          >
                            {new Date(c.startAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} {c.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* New course modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-5">新增課程</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="課程名稱 *">
                <input name="title" required className={inputCls} placeholder="例：Zumba 週末課" />
              </Field>

              <Field label="標籤">
                <div className={`${inputCls} flex flex-wrap gap-1.5 cursor-text min-h-[38px]`} onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
                  {tags.map(t => (
                    <span key={t} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                      {t}
                      <button type="button" onClick={() => setTags(p => p.filter(x => x !== t))} className="hover:text-indigo-900">×</button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? '輸入後按 Enter 新增標籤' : ''}
                    className="outline-none text-sm flex-1 min-w-[120px] bg-transparent"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="開始時間 *">
                  <input name="startAt" type="datetime-local" required defaultValue={modalDate} className={inputCls} />
                </Field>
                <Field label="時長（分鐘）*">
                  <input name="durationMin" type="number" required min={1} defaultValue={60} className={inputCls} />
                </Field>
              </div>

              <Field label="上課地點 *">
                <input name="location" required className={inputCls} placeholder="例：台北市信義區XX室" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="人數上限 *">
                  <input name="maxSlots" type="number" required min={1} defaultValue={10} className={inputCls} />
                </Field>
                <Field label="費用（NT$）*">
                  <input name="price" type="number" required min={0} defaultValue={0} className={inputCls} />
                </Field>
              </div>

              <Field label="課程描述">
                <textarea name="description" rows={2} className={inputCls} placeholder="選填" />
              </Field>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors">
                  取消
                </button>
                <button type="submit" disabled={isPending} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isPending ? '建立中...' : '建立課程'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel course confirmation */}
      {confirmCancelId && (() => {
        const course = courses.find(c => c.id === confirmCancelId)
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirmCancelId(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2">取消課程</h3>
              {course && (
                <div className="text-sm text-gray-600 mb-4 space-y-1">
                  <p className="font-medium">{course.title}</p>
                  <p>{new Date(course.startAt).toLocaleString('zh-TW')}</p>
                  <p>{course.location}</p>
                  {course.status === 'CANCELLED' && (
                    <p className="text-gray-400 mt-2">此課程已取消。</p>
                  )}
                </div>
              )}
              {course?.status === 'ACTIVE' && (
                <>
                  <p className="text-sm text-gray-500 mb-4">取消後無法復原（Phase 3 將加入退款流程）。</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmCancelId(null)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
                      返回
                    </button>
                    <button
                      onClick={() => handleCancel(confirmCancelId)}
                      disabled={isPending}
                      className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {isPending ? '取消中...' : '確認取消'}
                    </button>
                  </div>
                </>
              )}
              {course?.status !== 'ACTIVE' && (
                <button onClick={() => setConfirmCancelId(null)} className="w-full border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
                  關閉
                </button>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
