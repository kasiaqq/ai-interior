import { AppError } from '#shared/errors'

const MAX_EDGE = 1024
const MIN_SHORT_SIDE = 256
const MAX_BYTES = 20 * 1024 * 1024
const JPEG_QUALITY = 0.9

const floorTo16 = (n: number) => Math.max(16, Math.floor(n / 16) * 16)

/** Longest edge ≤ 1024 (never upscaled), each side floored to a multiple of 16 as the image model requires. */
export function targetSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  return { width: floorTo16(width * scale), height: floorTo16(height * scale) }
}

/** Decodes, scales and centre-crops a photo to a JPEG the model accepts. Drawing on a canvas also drops EXIF. */
export async function normalizePhoto(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (!file.type.startsWith('image/') || file.size > MAX_BYTES) throw new AppError('INVALID_FILE')

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => {
    throw new AppError('INVALID_FILE')
  })
  try {
    const size = targetSize(bitmap.width, bitmap.height)
    if (Math.min(size.width, size.height) < MIN_SHORT_SIDE) throw new AppError('INVALID_FILE')

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const sourceWidth = size.width / scale
    const sourceHeight = size.height / scale
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    canvas.getContext('2d')!.drawImage(
      bitmap,
      (bitmap.width - sourceWidth) / 2,
      (bitmap.height - sourceHeight) / 2,
      sourceWidth,
      sourceHeight,
      0,
      0,
      size.width,
      size.height,
    )
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) throw new AppError('INVALID_FILE')
    return { blob, ...size }
  } finally {
    bitmap.close()
  }
}
