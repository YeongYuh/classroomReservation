import { Resend } from 'resend'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

interface BookingConfirmationParams {
  to: string
  studentName: string
  courseTitle: string
  startAt: Date
  location: string
  qrImageDataUrl: string
  reservationId: string
}

export async function sendBookingConfirmation(params: BookingConfirmationParams): Promise<void> {
  const { to, studentName, courseTitle, startAt, location, qrImageDataUrl, reservationId } = params

  const dateStr = startAt.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const base64 = qrImageDataUrl.replace(/^data:image\/png;base64,/, '')

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@classroom.example.com',
    to,
    subject: `【預約確認】${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #16a34a;">預約確認通知</h2>
        <p>親愛的 ${studentName}，</p>
        <p>您的課程預約已確認！以下是您的課程資訊：</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280;">課程名稱</td><td style="padding: 8px; font-weight: bold;">${courseTitle}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">上課時間</td><td style="padding: 8px;">${dateStr}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">上課地點</td><td style="padding: 8px;">${location}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">預約編號</td><td style="padding: 8px; font-family: monospace;">${reservationId}</td></tr>
        </table>
        <p>請在上課時出示以下 QR Code 供老師掃描簽到：</p>
        <div style="text-align: center; margin: 24px 0;">
          <img src="cid:qr-code" alt="簽到 QR Code" style="width: 200px; height: 200px;" />
        </div>
        <p style="color: #6b7280; font-size: 14px;">如有任何問題，請透過平台私訊聯絡老師。</p>
      </div>
    `,
    attachments: [
      {
        filename: 'qr-code.png',
        content: base64,
        contentId: 'qr-code',
      },
    ],
  })
}

interface CourseCancellationParams {
  to: string
  studentName: string
  courseTitle: string
  startAt: Date
  refunded: boolean
}

export async function sendCourseCancellation(params: CourseCancellationParams): Promise<void> {
  const { to, studentName, courseTitle, startAt, refunded } = params

  const dateStr = startAt.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@classroom.example.com',
    to,
    subject: `【課程取消】${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #dc2626;">課程取消通知</h2>
        <p>親愛的 ${studentName}，</p>
        <p>很遺憾通知您，以下課程已由老師取消：</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280;">課程名稱</td><td style="padding: 8px; font-weight: bold;">${courseTitle}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">原定時間</td><td style="padding: 8px;">${dateStr}</td></tr>
        </table>
        ${refunded
          ? '<p style="color: #16a34a;">您的付款已全額退款，款項將於數個工作天內退回原付款方式。</p>'
          : '<p style="color: #6b7280;">此預約未產生付款，無需退款。</p>'
        }
        <p style="color: #6b7280; font-size: 14px;">造成不便，敬請見諒。</p>
      </div>
    `,
  })
}
