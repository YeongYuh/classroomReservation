'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createTeacher } from '../actions'
import Link from 'next/link'

export default function NewTeacherPage() {
  const router = useRouter()
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')
    const result = await createTeacher(new FormData(e.currentTarget))
    setPending(false)
    if (result.error) { setError(result.error); return }
    if (result.tempPassword) setTempPassword(result.tempPassword)
  }

  if (tempPassword) {
    return (
      <div className="max-w-md">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-green-800 dark:text-green-300">老師帳號已建立</h2>
          <p className="text-sm text-green-700 dark:text-green-400">請將以下臨時密碼提供給老師，他們可以登入後到忘記密碼頁面重設。</p>
          <div className="bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-center">
            {tempPassword}
          </div>
          <p className="text-xs text-green-600 dark:text-green-500">此密碼只顯示一次，請記得複製。</p>
          <button
            onClick={() => router.push('/admin/teachers')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            返回老師列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">新增老師</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">顯示名稱 *</label>
          <input
            name="displayName"
            required
            placeholder="例：Chloe 老師"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">簡介（選填）</label>
          <textarea
            name="bio"
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          系統會自動產生臨時密碼，建立後顯示給您複製。老師帳號狀態為「已審核」，可立即使用後台。
        </p>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {pending ? '建立中…' : '建立老師'}
          </button>
          <Link href="/admin/teachers" className="px-5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            取消
          </Link>
        </div>
      </form>
    </div>
  )
}
