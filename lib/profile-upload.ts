export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

export function validateUploadSize(sizeBytes: number): { valid: boolean; error?: string } {
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    const sizeMb = (sizeBytes / 1024 / 1024).toFixed(1)
    return { valid: false, error: `檔案大小超過 10MB 限制（目前 ${sizeMb}MB）` }
  }
  return { valid: true }
}
