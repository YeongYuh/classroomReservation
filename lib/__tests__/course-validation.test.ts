import { describe, it, expect } from 'vitest'
import { validateCourseInput } from '../course-validation'

const tomorrow = new Date(Date.now() + 25 * 60 * 60 * 1000)

const valid = {
  title: 'Zumba 基礎課',
  location: '台北健身房',
  startAt: tomorrow,
  durationMin: 60,
  maxSlots: 10,
  price: 500,
}

describe('validateCourseInput', () => {
  it('accepts a fully valid course', () => {
    expect(validateCourseInput(valid).valid).toBe(true)
  })

  it('rejects empty title', () => {
    const r = validateCourseInput({ ...valid, title: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.title).toBeDefined()
  })

  it('rejects empty location', () => {
    const r = validateCourseInput({ ...valid, location: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.location).toBeDefined()
  })

  it('rejects past startAt', () => {
    const r = validateCourseInput({ ...valid, startAt: new Date(2020, 0, 1) })
    expect(r.valid).toBe(false)
    expect(r.errors.startAt).toBeDefined()
  })

  it('rejects durationMin <= 0', () => {
    expect(validateCourseInput({ ...valid, durationMin: 0 }).valid).toBe(false)
    expect(validateCourseInput({ ...valid, durationMin: -1 }).valid).toBe(false)
  })

  it('rejects maxSlots <= 0', () => {
    expect(validateCourseInput({ ...valid, maxSlots: 0 }).valid).toBe(false)
    expect(validateCourseInput({ ...valid, maxSlots: -5 }).valid).toBe(false)
  })

  it('rejects negative price', () => {
    expect(validateCourseInput({ ...valid, price: -1 }).valid).toBe(false)
  })

  it('accepts free courses (price = 0)', () => {
    expect(validateCourseInput({ ...valid, price: 0 }).valid).toBe(true)
  })
})
