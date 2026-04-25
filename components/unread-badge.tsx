'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/messages')
        if (res.ok) {
          const data = await res.json() as { unreadCount: number }
          setCount(data.unreadCount)
        }
      } catch {
        // Silent fail — badge just stays stale
      }
    }

    poll()
    const interval = setInterval(poll, 10_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link href="/profile" className="relative inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
      訊息
      {count > 0 && (
        <span className="absolute -top-1.5 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
