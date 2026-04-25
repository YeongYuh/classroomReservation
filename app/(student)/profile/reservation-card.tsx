'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { ReservationForDisplay } from '@/lib/reservation-categorizer'

const statusLabel: Record<string, { text: string; cls: string }> = {
  PENDING:   { text: '待付款', cls: 'bg-yellow-100 text-yellow-700' },
  PAID:      { text: '已付款', cls: 'bg-green-100 text-green-700' },
  ATTENDED:  { text: '已出席', cls: 'bg-blue-100 text-blue-700' },
  CANCELLED: { text: '已取消', cls: 'bg-gray-100 text-gray-500' },
}

export function ReservationCard({ reservation }: { reservation: ReservationForDisplay }) {
  const [showQr, setShowQr] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [now] = useState(() => Date.now())
  const router = useRouter()
  const { course, status, qrCode, hasReview, courseId } = reservation

  const hoursUntilStart = (new Date(course.startAt).getTime() - now) / (1000 * 60 * 60)
  const canCancel = (status === 'PAID' || status === 'PENDING') && hoursUntilStart >= 24
  const canReview = status === 'ATTENDED' && !hasReview

  async function handleCancel() {
    if (!confirm('確定要取消此預約？符合退款條件將自動退款。')) return
    setCancelling(true)
    setCancelError('')
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setCancelError(data.error ?? '取消失敗'); return }
      router.refresh()
    } catch {
      setCancelError('網路錯誤，請稍後再試')
    } finally {
      setCancelling(false)
    }
  }

  const dateStr = new Date(course.startAt).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const label = statusLabel[status] ?? { text: status, cls: 'bg-gray-100 text-gray-600' }

  return (
    <>
      <div className="border rounded-xl p-4 bg-white shadow-sm flex gap-4 items-start">
        {course.teacher.avatarUrl ? (
          <Image
            src={course.teacher.avatarUrl}
            alt={course.teacher.displayName}
            width={44}
            height={44}
            className="rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-400 text-sm font-bold">
            {course.teacher.displayName.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-800 truncate">{course.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${label.cls}`}>
              {label.text}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{course.teacher.displayName}</p>
          <p className="text-sm text-gray-500">{dateStr} · {course.durationMin} 分鐘 · {course.location}</p>
          <p className="text-sm font-medium text-gray-700 mt-1">NT$ {Number(course.price).toLocaleString()}</p>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {status === 'PAID' && qrCode && (
              <button
                onClick={() => setShowQr(true)}
                className="text-sm text-green-600 underline underline-offset-2 hover:text-green-700"
              >
                顯示簽到 QR Code
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm text-red-500 underline underline-offset-2 hover:text-red-600 disabled:opacity-50"
              >
                {cancelling ? '取消中...' : '取消預約'}
              </button>
            )}
            {canReview && (
              <button
                onClick={() => setShowReview((v) => !v)}
                className="text-sm text-indigo-500 underline underline-offset-2 hover:text-indigo-600"
              >
                {showReview ? '收起評價' : '撰寫評價'}
              </button>
            )}
            {status === 'ATTENDED' && hasReview && (
              <span className="text-xs text-gray-400">已評價</span>
            )}
          </div>
          {cancelError && <p className="text-xs text-red-500 mt-1">{cancelError}</p>}

          {showReview && canReview && (
            <ReviewForm
              courseId={courseId}
              onSubmitted={() => { setShowReview(false); router.refresh() }}
            />
          )}
        </div>
      </div>

      {showQr && qrCode && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-gray-800">{course.title}</p>
            <QrCodeImage payload={qrCode} />
            <p className="text-xs text-gray-400">點擊背景關閉</p>
          </div>
        </div>
      )}
    </>
  )
}

function ReviewForm({ courseId, onSubmitted }: { courseId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('請選擇評分'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, rating, comment: comment || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '評價失敗'); return }
      onSubmitted()
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t pt-3 space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl leading-none focus:outline-none"
            aria-label={`${s} 星`}
          >
            <span className={(hovered || rating) >= s ? 'text-yellow-400' : 'text-gray-200'}>★</span>
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="分享您的上課體驗（選填）"
        rows={3}
        maxLength={500}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="text-sm bg-indigo-600 text-white rounded-lg px-4 py-1.5 hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? '送出中...' : '送出評價'}
      </button>
    </form>
  )
}

function QrCodeImage({ payload }: { payload: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  if (!src && loading) {
    import('qrcode').then((mod) => {
      mod.default.toDataURL(payload).then((url) => {
        setSrc(url)
        setLoading(false)
      })
    })
  }

  if (loading) return <div className="w-48 h-48 bg-gray-100 rounded-lg animate-pulse" />

  return (
    <Image src={src!} alt="QR Code" width={192} height={192} unoptimized />
  )
}
