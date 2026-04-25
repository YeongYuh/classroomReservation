import { describe, it, expect } from 'vitest'
import { validateUploadSize, MAX_UPLOAD_BYTES } from '../profile-upload'

describe('validateUploadSize', () => {
  it('accepts files under 10MB', () => {
    expect(validateUploadSize(1 * 1024 * 1024).valid).toBe(true)
    expect(validateUploadSize(MAX_UPLOAD_BYTES - 1).valid).toBe(true)
  })

  it('accepts file exactly at 10MB', () => {
    expect(validateUploadSize(MAX_UPLOAD_BYTES).valid).toBe(true)
  })

  it('rejects files over 10MB and includes size in error', () => {
    const result = validateUploadSize(MAX_UPLOAD_BYTES + 1)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('10MB')
  })

  it('accepts empty files', () => {
    expect(validateUploadSize(0).valid).toBe(true)
  })
})
