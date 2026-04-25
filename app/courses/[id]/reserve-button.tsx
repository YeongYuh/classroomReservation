'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  courseId: string
  isLoggedIn: boolean
  loginUrl: string
}

export function ReserveButton({ courseId, isLoggedIn, loginUrl }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isLoggedIn) {
    return (
      <a
        href={loginUrl}
        className="block w-full text-center bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 transition-colors"
      >
        登入後預約
      </a>
    )
  }

  async function handleReserve() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? '預約失敗，請稍後再試')
        return
      }
      router.push('/profile')
    } catch {
      setStatus('error')
      setErrorMsg('網路錯誤，請稍後再試')
    }
  }

  return (
    <div>
      <button
        onClick={handleReserve}
        disabled={status === 'loading'}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? '預約中...' : '立即預約'}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-sm mt-2 text-center">{errorMsg}</p>
      )}
    </div>
  )
}
