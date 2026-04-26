'use client'

import { Suspense, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-500 dark:text-red-400 text-sm">重設連結無效或已過期。</p>
        <Link href="/forgot-password" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          重新申請
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const newPassword = fd.get('newPassword') as string
    const confirm = fd.get('confirm') as string
    if (newPassword !== confirm) {
      setError('兩次輸入的密碼不一致')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? '重設失敗，請重新申請')
      return
    }
    router.push('/login?reset=success')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">新密碼</label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={8}
          autoFocus
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">確認新密碼</label>
        <input
          type="password"
          name="confirm"
          required
          minLength={8}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? '更新中…' : '更新密碼'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">重設密碼</h1>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
