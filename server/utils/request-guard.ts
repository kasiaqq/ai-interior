import { createError, defineEventHandler, getRequestHeader, getRequestHost, getRequestIP, readMultipartFormData, type H3Event } from 'h3'
import { AppError } from '#shared/errors'
import { statusFor } from './generate'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
// The browser sends one normalized JPEG (longest edge 1024 px), far below this; Vercel caps bodies at 4.5 MB anyway.
const MAX_BODY_BYTES = 4 * 1024 * 1024

export interface ApiForm {
  fields: Record<string, string>
  photo?: Uint8Array
}

/** Browsers send Origin on every POST; a missing or foreign one means another site or a script. */
export function assertSameOrigin(event: H3Event) {
  const origin = getRequestHeader(event, 'origin')
  const host = getRequestHost(event, { xForwardedHost: true })
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== host) throw new AppError('VERIFICATION_FAILED')
}

/** Content-Length is required so the body is bounded before it is read into memory. */
export async function readApiForm(event: H3Event): Promise<ApiForm> {
  const length = Number(getRequestHeader(event, 'content-length'))
  if (!length || length > MAX_BODY_BYTES) throw new AppError('INVALID_FILE')
  const parts = (await readMultipartFormData(event)) ?? []
  const photo = parts.find((part) => part.name === 'photo')?.data
  return {
    fields: Object.fromEntries(parts.filter((part) => !part.filename).map((part) => [part.name, part.data.toString()])),
    photo: photo && new Uint8Array(photo),
  }
}

/** TURNSTILE_VERIFY_URL exists only so tests can point verification at a local stand-in. */
export async function verifyTurnstile(token: string | undefined, remoteIp: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.error('Turnstile is not configured: set TURNSTILE_SECRET_KEY')
    throw new AppError('GENERATION_FAILED')
  }
  if (!token) throw new AppError('VERIFICATION_FAILED')
  const response = await fetch(process.env.TURNSTILE_VERIFY_URL || VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
  })
  const body: { success?: boolean } = await response.json().catch(() => ({}))
  if (body.success !== true) throw new AppError('VERIFICATION_FAILED')
}

/** An API route that only answers same-origin requests carrying a valid Turnstile token. */
export function defineGuardedHandler<T>(handle: (form: ApiForm) => Promise<T>) {
  return defineEventHandler(async (event) => {
    try {
      assertSameOrigin(event)
      const form = await readApiForm(event)
      await verifyTurnstile(form.fields.turnstileToken, getRequestIP(event, { xForwardedFor: true }))
      return await handle(form)
    } catch (error) {
      const code = error instanceof AppError ? error.code : 'GENERATION_FAILED'
      throw createError({ statusCode: statusFor(code), data: { code } })
    }
  })
}
