import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoutButton } from '@/components/logout-button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== Role.ADMIN) redirect('/login')

  return (
    <div className="min-h-screen flex">
      <nav className="w-56 bg-gray-900 dark:bg-gray-950 text-white flex flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">管理後台</p>
        <Link href="/admin/dashboard" className="px-3 py-2 rounded hover:bg-gray-700 text-sm">數據看板</Link>
        <Link href="/admin/users" className="px-3 py-2 rounded hover:bg-gray-700 text-sm">人員管理</Link>
        <Link href="/admin/ads" className="px-3 py-2 rounded hover:bg-gray-700 text-sm">廣告管理</Link>
        <Link href="/admin/classrooms" className="px-3 py-2 rounded hover:bg-gray-700 text-sm">教室管理</Link>
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <ThemeToggle />
          <LogoutButton className="text-xs text-gray-400 hover:text-white text-left px-1 transition-colors" />
        </div>
      </nav>
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">{children}</main>
    </div>
  )
}
