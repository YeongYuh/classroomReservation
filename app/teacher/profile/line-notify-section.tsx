'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LineNotifySection({ connected }: { connected: boolean }) {
  const [disconnecting, setDisconnecting] = useState(false)
  const router = useRouter()

  async function handleDisconnect() {
    if (!confirm('確定要解除 LINE Notify 綁定？')) return
    setDisconnecting(true)
    try {
      await fetch('/api/line-notify/disconnect', { method: 'POST' })
      router.refresh()
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">LINE Notify 通知</h2>
      <p className="text-sm text-gray-500 mb-4">
        綁定後，每當有新學員報名您的課程，您將收到 LINE 即時推播通知。
      </p>

      {connected ? (
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
            已綁定
          </span>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-sm text-red-500 underline underline-offset-2 hover:text-red-600 disabled:opacity-50"
          >
            {disconnecting ? '解除中...' : '解除綁定'}
          </button>
        </div>
      ) : (
        <a
          href="/api/line-notify/connect"
          className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          綁定 LINE Notify
        </a>
      )}
    </div>
  )
}
