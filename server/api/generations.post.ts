import { AppError } from '#shared/errors'
import { generateRestyle, parseGenerationForm, statusFor } from '../utils/generate'

export default defineEventHandler(async (event) => {
  const parts = (await readMultipartFormData(event)) ?? []
  const fields = Object.fromEntries(parts.filter((p) => !p.filename).map((p) => [p.name, p.data.toString()]))
  const photo = parts.find((p) => p.name === 'photo')?.data
  try {
    return await generateRestyle(parseGenerationForm(fields, photo && new Uint8Array(photo)))
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'GENERATION_FAILED'
    throw createError({ statusCode: statusFor(code), data: { code } })
  }
})
