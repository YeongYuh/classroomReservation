'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Message {
  id: string
  body: string
  senderId: string
  createdAt: string
  readAt: string | null
  sender: { name: string | null }
}

interface Props {
  threadId: string
  currentUserId: string
  otherUserName: string
}

export function ConversationView({ threadId, currentUserId, otherUserName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const otherUserId = threadId.split(':').find((id) => id !== currentUserId) ?? ''

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${threadId}`)
      if (res.ok) {
        const data = await res.json() as Message[]
        setMessages(data)
      }
    } catch {
      // Silently retry on next poll
    }
  }, [threadId])

  // Initial load + polling every 10 s
  // setTimeout defers the first call past the synchronous render phase,
  // avoiding the react-hooks/set-state-in-effect violation.
  useEffect(() => {
    const timeoutId = setTimeout(fetchMessages, 0)
    const interval = setInterval(fetchMessages, 10_000)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [fetchMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: otherUserId, body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '發送失敗'); return }
      setDraft('')
      await fetchMessages()
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col h-[70vh] border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">尚無訊息，傳送第一則訊息吧！</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isMine && (
                  <span className="text-xs text-gray-400 px-1">{msg.sender.name ?? otherUserName}</span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.body}
                </div>
                <span className="text-xs text-gray-300 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {isMine && msg.readAt && <span className="ml-1">已讀</span>}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t p-3 flex gap-2 items-end bg-gray-50">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="輸入訊息… (Enter 送出，Shift+Enter 換行)"
          rows={2}
          maxLength={2000}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="shrink-0 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {sending ? '…' : '送出'}
        </button>
      </form>
      {error && <p className="text-xs text-red-500 px-3 pb-2">{error}</p>}
    </div>
  )
}
