import { AppError, type ErrorCode } from '#shared/errors'
import type { ChangeDescription, GenerationResponse, PhotoAnalysis, ProblemId, RoomTypeId, StyleId } from '#shared/types'

const KNOWN_CODES: ErrorCode[] = ['INVALID_FILE', 'QUOTA_REACHED', 'GENERATION_FAILED', 'NETWORK']

async function post<T>(url: string, body: FormData, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { method: 'POST', body, signal })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new AppError('NETWORK')
  }
  if (response.ok) return response.json()
  const code = (await response.json().catch(() => null))?.data?.code
  throw new AppError(KNOWN_CODES.includes(code) ? code : 'GENERATION_FAILED')
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
