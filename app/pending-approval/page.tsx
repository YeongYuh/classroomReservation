import Link from 'next/link'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 text-center space-y-4">
        <div className="text-4xl">⏳</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">等待審核中</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          您的帳號已送出，正在等待管理員審核。審核通過後即可登入使用。
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          返回登入頁
        </Link>
      </div>
    </div>
  )
}
