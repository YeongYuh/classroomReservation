import Link from 'next/link'
import { UnreadBadge } from '@/components/unread-badge'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-indigo-600">有氧課程</Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">探索課程</Link>
            <UnreadBadge />
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">我的課表</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
