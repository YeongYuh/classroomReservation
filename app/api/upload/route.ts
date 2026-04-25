import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Role } from '@prisma/client'
import { validateUploadSize } from '@/lib/profile-upload'
import { uploadFile } from '@/lib/cloudinary'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== Role.TEACHER) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '未選擇檔案' }, { status: 400 })

  const sizeCheck = validateUploadSize(file.size)
  if (!sizeCheck.valid) {
    return NextResponse.json({ error: sizeCheck.error }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: '僅支援圖片（JPG、PNG、WebP）或 PDF 檔案' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(buffer, file.type, 'teachers')
  return NextResponse.json({ url })
}
