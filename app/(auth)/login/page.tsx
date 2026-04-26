'use client'

import { Suspense, useState, FormEvent } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const registered = searchParams.get('registered')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })

    setLoading(false)
    if (result?.error) {
      setError('Email 或密碼錯誤')
      return
    }
    const session = await getSession()
    if ((session?.user as { status?: string })?.status === 'PENDING') {
      router.push('/pending-approval')
      return
    }
    router.push(callbackUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">登入</h1>

        {registered && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-700 dark:text-green-400">
            帳號已建立，請登入。
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密碼</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          使用 Google 登入
        </button>

        <div className="flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            忘記密碼？
          </Link>
          <span>
            還沒有帳號？{' '}
            <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              立即註冊
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
