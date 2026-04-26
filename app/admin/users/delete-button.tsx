'use client'

import { deleteUser } from './actions'

export function DeleteUserButton({ id, label }: { id: string; label: string }) {
  async function handleAction(formData: FormData) {
    if (!confirm(`確定要刪除「${label}」嗎？此操作無法復原。`)) return
    await deleteUser(formData)
  }

  return (
    <form action={handleAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs px-3 py-1 rounded border border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        刪除
      </button>
    </form>
  )
}
