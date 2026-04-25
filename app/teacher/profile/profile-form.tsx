'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from './actions'

interface Props {
  profile: {
    displayName: string
    bio: string | null
    avatarUrl: string | null
    certUrls: string[]
    youtubeUrl: string | null
  }
}

export function ProfileForm({ profile }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '')
  const [certUrls, setCertUrls] = useState<string[]>(profile.certUrls)
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleUpload(file: File, onSuccess: (url: string) => void) {
    setUploadError('')
    const TEN_MB = 10 * 1024 * 1024
    if (file.size > TEN_MB) {
      setUploadError(`檔案大小超過 10MB 限制（目前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`)
      return
    }
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? '上傳失敗'); return }
      onSuccess(data.url)
    } finally {
      setIsUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('avatarUrl', avatarUrl)
    fd.set('certUrls', JSON.stringify(certUrls))
    startTransition(async () => {
      await updateProfile(fd)
      setSavedMsg('儲存成功！')
      setTimeout(() => setSavedMsg(''), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">顯示名稱</label>
        <input
          name="displayName"
          defaultValue={profile.displayName}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">個人簡介</label>
        <textarea
          name="bio"
          defaultValue={profile.bio ?? ''}
          rows={4}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">YouTube 頻道網址</label>
        <input
          name="youtubeUrl"
          type="url"
          defaultValue={profile.youtubeUrl ?? ''}
          placeholder="https://youtube.com/@..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">大頭照</label>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm border">
              無
            </div>
          )}
          <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
            選擇圖片
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file, setAvatarUrl)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">師資證照</label>
        <ul className="space-y-1 mb-3">
          {certUrls.map((url, i) => (
            <li key={url} className="flex items-center gap-2 text-sm">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline truncate max-w-sm"
              >
                證照 {i + 1}
              </a>
              <button
                type="button"
                onClick={() => setCertUrls((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-red-400 hover:text-red-600 text-xs shrink-0"
              >
                移除
              </button>
            </li>
          ))}
        </ul>
        <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
          上傳證照（圖片或 PDF）
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file, (url) => setCertUrls((prev) => [...prev, url]))
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
      {isUploading && <p className="text-gray-500 text-sm">上傳中...</p>}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '儲存中...' : '儲存'}
        </button>
        {savedMsg && <span className="text-green-600 text-sm">{savedMsg}</span>}
      </div>
    </form>
  )
}
