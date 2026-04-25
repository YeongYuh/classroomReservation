export interface CourseInput {
  title: string
  location: string
  startAt: Date
  durationMin: number
  maxSlots: number
  price: number
}

export interface CourseValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateCourseInput(input: CourseInput): CourseValidationResult {
  const errors: Record<string, string> = {}

  if (!input.title.trim()) errors.title = '課程名稱為必填'
  if (!input.location.trim()) errors.location = '上課地點為必填'
  if (input.startAt <= new Date()) errors.startAt = '開始時間必須在未來'
  if (input.durationMin <= 0) errors.durationMin = '課程時長必須大於 0 分鐘'
  if (input.maxSlots <= 0) errors.maxSlots = '人數上限必須大於 0'
  if (input.price < 0) errors.price = '價格不可為負數'

  return { valid: Object.keys(errors).length === 0, errors }
}
