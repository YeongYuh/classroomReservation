'use client'

import { useState } from 'react'

interface Props {
  reservationId: string
}

export function PayButton({ reservationId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/linepay/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '付款請求失敗'); setLoading(false); return }
      window.location.href = data.paymentUrl
    } catch {
      setError('網路錯誤，請稍後再試')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-green-600 text-white rounded-xl py-3 font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '前往 LINE Pay...' : '使用 LINE Pay 付款'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  )
}
