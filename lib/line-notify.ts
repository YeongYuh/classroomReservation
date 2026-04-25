export interface EnrollmentNotifyPayload {
  courseTitle: string
  studentName: string
  startAt: Date
  currentCount: number
  maxSlots: number
}

export function buildEnrollmentNotifyMessage(payload: EnrollmentNotifyPayload): string {
  const { courseTitle, studentName, startAt, currentCount, maxSlots } = payload
  const dateStr = startAt.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    `\n【新學員報名】${courseTitle}` +
    `\n學員：${studentName}` +
    `\n課程時間：${dateStr}` +
    `\n目前報名：${currentCount} / ${maxSlots} 人`
  )
}

export async function sendLineNotify(token: string, message: string): Promise<void> {
  const res = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ message }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`LINE Notify failed: ${res.status} ${text}`)
  }
}
