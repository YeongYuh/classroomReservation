import { describe, it, expect } from 'vitest'
import { validateReview, type ReviewInput } from '../review-validation'

function makeInput(overrides: Partial<ReviewInput> = {}): ReviewInput {
  return { rating: 5, comment: '很棒！', ...overrides }
}

describe('validateReview', () => {
  it('accepts valid rating and comment', () => {
    expect(validateReview(makeInput()).valid).toBe(true)
  })

  it('accepts rating without comment', () => {
    expect(validateReview(makeInput({ comment: undefined })).valid).toBe(true)
  })

  it('accepts all valid integer ratings 1–5', () => {
    for (const r of [1, 2, 3, 4, 5]) {
      expect(validateReview(makeInput({ rating: r })).valid).toBe(true)
    }
  })

  it('rejects rating 0', () => {
    const result = validateReview(makeInput({ rating: 0 }))
    expect(result.valid).toBe(false)
    expect(result.errors?.rating).toBeTruthy()
  })

  it('rejects rating 6', () => {
    const result = validateReview(makeInput({ rating: 6 }))
    expect(result.valid).toBe(false)
    expect(result.errors?.rating).toBeTruthy()
  })

  it('rejects non-integer rating (4.5)', () => {
    const result = validateReview(makeInput({ rating: 4.5 }))
    expect(result.valid).toBe(false)
    expect(result.errors?.rating).toBeTruthy()
  })

  it('rejects comment over 500 characters', () => {
    const result = validateReview(makeInput({ comment: 'a'.repeat(501) }))
    expect(result.valid).toBe(false)
    expect(result.errors?.comment).toBeTruthy()
  })

  it('accepts comment exactly 500 characters', () => {
    expect(validateReview(makeInput({ comment: 'a'.repeat(500) })).valid).toBe(true)
  })
})
