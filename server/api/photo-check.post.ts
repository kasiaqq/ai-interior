import { AppError } from '#shared/errors'
import { checkPhotoQuality } from '../utils/photo-check'
import { defineGuardedHandler } from '../utils/request-guard'

export default defineGuardedHandler(async ({ photo }) => {
  if (!photo) throw new AppError('INVALID_FILE')
  return checkPhotoQuality(photo)
})
