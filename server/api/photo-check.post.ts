import { checkPhotoQuality } from '../utils/photo-check'

export default defineEventHandler(async (event) => {
  const photo = (await readMultipartFormData(event))?.find((part) => part.name === 'photo')
  if (!photo) throw createError({ statusCode: 400, data: { code: 'INVALID_FILE' } })
  return checkPhotoQuality(new Uint8Array(photo.data))
})
