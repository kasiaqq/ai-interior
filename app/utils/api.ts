import { AppError, type ErrorCode } from '#shared/errors'
import type { ChangeDescription, GenerationResponse, PhotoAnalysis, ProblemId, RoomTypeId, StyleId } from '#shared/types'
import { turnstileToken } from './turnstile'

const KNOWN_CODES: ErrorCode[] = ['INVALID_FILE', 'QUOTA_REACHED', 'GENERATION_FAILED', 'NETWORK', 'VERIFICATION_FAILED']

async function post<T>(url: string, body: FormData, signal?: AbortSignal): Promise<T> {
  body.append('turnstileToken', await turnstileToken())
  let response: Response
  try {
    response = await fetch(url, { method: 'POST', body, signal })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new AppError('NETWORK')
  }
  if (response.ok) return response.json()
  const code = (await response.json().catch(() => null))?.data?.code
  if (KNOWN_CODES.includes(code)) throw new AppError(code)
  // Our routes always name their error; a bare 429 comes from Vercel's rate-limit rule.
  throw new AppError(response.status === 429 ? 'RATE_LIMITED' : 'GENERATION_FAILED')
}

export function checkPhoto(photo: Blob): Promise<PhotoAnalysis> {
  const form = new FormData()
  form.append('photo', photo, 'photo.jpg')
  return post('/api/photo-check', form)
}

export async function requestGeneration(
  input: {
    photo: Blob
    width: number
    height: number
    roomType: RoomTypeId
    style: StyleId
    seed: number
    problem?: ProblemId
  },
  signal: AbortSignal,
): Promise<{ blob: Blob; description: ChangeDescription | null }> {
  const { photo, ...fields } = input
  const form = new FormData()
  form.append('photo', photo, 'photo.jpg')
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.append(key, String(value))

  const response = await post<GenerationResponse>('/api/generations', form, signal)
  const bytes = Uint8Array.from(atob(response.image), (c) => c.charCodeAt(0))
  return { blob: new Blob([bytes], { type: 'image/jpeg' }), description: response.description }
}
