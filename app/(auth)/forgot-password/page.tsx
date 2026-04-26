'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const email = (new FormData(e.currentTarget)).get('email') as string
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">忘記密碼</h1>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">📧</div>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              如果此 Email 已註冊，我們已發送密碼重設連結至您的信箱。請檢查信件（含垃圾郵件夾）。
            </p>
            <Link href="/login" className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              返回登入
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              請輸入您的 Email，我們將寄送密碼重設連結。
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  autoFocus
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? '寄送中…' : '發送重設連結'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                返回登入
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
