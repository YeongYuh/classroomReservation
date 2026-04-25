export function canAccessThread(
  currentUserId: string,
  senderId: string,
  receiverId: string
): boolean {
  if (!currentUserId) return false
  return currentUserId === senderId || currentUserId === receiverId
}

export function buildThreadKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join(':')
}

export function validateMessageBody(body: string): { valid: boolean; error?: string } {
  if (!body || !body.trim()) {
    return { valid: false, error: '訊息不可為空' }
  }
  if (body.length > 2000) {
    return { valid: false, error: '訊息不可超過 2000 字' }
  }
  return { valid: true }
}
