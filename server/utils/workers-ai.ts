import { AppError } from '#shared/errors'

const IMAGE_MODEL = '@cf/black-forest-labs/flux-2-klein-4b'
const VISION_MODEL = '@cf/mistralai/mistral-small-3.1-24b-instruct'
const QUOTA_ERROR_CODE = 4006

interface CloudflareBody {
  success?: boolean
  errors?: { code?: number }[]
  result?: { image?: string }
  choices?: { message?: { content?: string } }[]
}

const DEFAULT_API_BASE = 'https://api.cloudflare.com/client/v4'
const REQUIRED_ENV = ['CF_ACCOUNT_ID', 'CF_API_TOKEN'] as const

/** CF_API_BASE exists only so tests can point the client at a local stand-in for Cloudflare. */
function accountUrl(path: string) {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name])
  if (missing.length) {
    console.error(`Workers AI is not configured: set ${missing.join(' and ')}`)
    throw new AppError('GENERATION_FAILED')
  }
  return `${process.env.CF_API_BASE || DEFAULT_API_BASE}/accounts/${process.env.CF_ACCOUNT_ID}/ai/${path}`
}

const authHeader = () => ({ Authorization: `Bearer ${process.env.CF_API_TOKEN}` })

async function readBody(response: Response): Promise<CloudflareBody> {
  const body: CloudflareBody = await response.json().catch(() => ({}))
  const isQuota = response.status === 429 || body.errors?.some((e) => e.code === QUOTA_ERROR_CODE)
  if (isQuota) throw new AppError('QUOTA_REACHED')
  if (!response.ok) throw new AppError('GENERATION_FAILED')
  return body
}

export async function runImageEdit(input: {
  image: Uint8Array
  prompt: string
  width: number
  height: number
  seed: number
}): Promise<Uint8Array> {
  const form = new FormData()
  form.append('prompt', input.prompt)
  form.append('input_image_0', new Blob([input.image as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' }), 'photo.jpg')
  form.append('width', String(input.width))
  form.append('height', String(input.height))
  form.append('seed', String(input.seed))

  const response = await fetch(accountUrl(`run/${IMAGE_MODEL}`), { method: 'POST', headers: authHeader(), body: form })
  const body = await readBody(response)
  if (!body.success || !body.result?.image) throw new AppError('GENERATION_FAILED')
  return new Uint8Array(Buffer.from(body.result.image, 'base64'))
}

export async function runVisionChat(input: { prompt: string; images: Uint8Array[]; maxTokens: number }): Promise<string> {
  const images = input.images.map((image) => ({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${Buffer.from(image).toString('base64')}` },
  }))
  const response = await fetch(accountUrl('v1/chat/completions'), {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: input.maxTokens,
      messages: [{ role: 'user', content: [{ type: 'text', text: input.prompt }, ...images] }],
    }),
  })
  const content = (await readBody(response)).choices?.[0]?.message?.content
  if (!content) throw new AppError('GENERATION_FAILED')
  return content
}
