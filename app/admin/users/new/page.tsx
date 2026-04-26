'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Role, UserStatus } from '@prisma/client'

const ROLE_LABELS: Record<Role, string> = { ADMIN: '管理員', TEACHER: '老師', STUDENT: '學員' }
const STATUS_LABELS: Record<UserStatus, string> = { PENDING: '待審核', ACTIVE: '啟用', SUSPENDED: '停用' }

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

export default function NewUserPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: fd.get('email'),
        name: fd.get('name'),
        role: fd.get('role'),
        status: fd.get('status'),
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? '建立失敗')
      return
    }

    setTempPassword(data.tempPassword)
  }

  if (tempPassword) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">人員已建立</h1>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-4 text-sm space-y-2">
          <p className="text-green-700 dark:text-green-400 font-medium">臨時密碼（僅顯示一次，請立即記錄）</p>
          <p className="font-mono text-lg font-bold text-green-800 dark:text-green-300">{tempPassword}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <Link href="/admin/users" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            返回人員列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-sm text-gray-500 dark:text-gray-400 hover:underline">← 返回</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">新增人員</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <label className={labelCls}>Email</label>
          <input name="email" type="email" required className={inputCls} placeholder="user@example.com" />
        </div>
        <div>
          <label className={labelCls}>姓名</label>
          <input name="name" type="text" required className={inputCls} placeholder="顯示名稱" />
        </div>
        <div>
          <label className={labelCls}>身分</label>
          <select name="role" className={inputCls}>
            {Object.values(Role).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>狀態</label>
          <select name="status" defaultValue={UserStatus.ACTIVE} className={inputCls}>
            {Object.values(UserStatus).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? '建立中...' : '建立人員'}
        </button>
      </form>
    </div>
  )
}
