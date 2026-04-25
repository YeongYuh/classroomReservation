export interface ReportRow {
  date: string
  courseTitle: string
  studentName: string
  amount: number
  platformFee: number
  teacherAmount: number
}

const HEADERS = ['日期', '課程名', '學員', '金額', '平台抽成', '老師所得']

function escapeField(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildReportCsv(rows: ReportRow[]): string {
  const lines: string[] = [HEADERS.map(escapeField).join(',')]

  for (const row of rows) {
    lines.push(
      [
        row.date,
        row.courseTitle,
        row.studentName,
        row.amount,
        row.platformFee,
        row.teacherAmount,
      ]
        .map(escapeField)
        .join(',')
    )
  }

  return lines.join('\r\n')
}
