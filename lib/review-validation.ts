export interface ReviewInput {
  rating: number
  comment?: string
}

export interface ReviewValidationResult {
  valid: boolean
  errors?: { rating?: string; comment?: string }
}

export function validateReview(input: ReviewInput): ReviewValidationResult {
  const errors: { rating?: string; comment?: string } = {}

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.rating = '評分必須是 1 到 5 的整數'
  }

  if (input.comment !== undefined && input.comment.length > 500) {
    errors.comment = '留言不可超過 500 字'
  }

  return Object.keys(errors).length === 0
    ? { valid: true }
    : { valid: false, errors }
}
