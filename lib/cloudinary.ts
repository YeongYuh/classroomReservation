import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadFile(buffer: Buffer, mimeType: string, folder = 'teachers'): Promise<string> {
  const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image'

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: resourceType }, (error, result) => {
        if (error || !result) reject(error ?? new Error('Cloudinary upload failed'))
        else resolve(result.secure_url)
      })
      .end(buffer)
  })
}
