import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { fileURLToPath } from 'node:url'
import { setup, url } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

/** Stands in for Cloudflare so the real routes run end to end without spending quota. */
const CLOUDFLARE_PORT = 4599
const VALID_TOKEN = 'human'
let quotaUsedUp = false

const description = {
  palette: [
    { role: 'Paper walls', hex: '#F5E9DC' },
    { role: 'Oak floor', hex: '#C39A6B' },
    { role: 'Sage', hex: '#8C9784' },
  ],
  keyPieces: ['Low sage sofa'],
  changes: ['Carpet replaced with oak'],
  kept: ['Radiator under the window'],
  summary: 'A calm Japandi room.',
}

let cloudflare: Server
beforeAll(async () => {
  cloudflare = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      response.setHeader('Content-Type', 'application/json')
      if (request.url === '/siteverify') {
        const { response: token } = JSON.parse(Buffer.concat(chunks).toString())
        return response.end(JSON.stringify({ success: token === VALID_TOKEN }))
      }
      if (quotaUsedUp) {
        response.statusCode = 429
        return response.end(JSON.stringify({ success: false, errors: [{ code: 4006 }] }))
      }
      if (request.url?.includes('/ai/run/')) {
        return response.end(JSON.stringify({ success: true, result: { image: Buffer.from('after').toString('base64') } }))
      }
      response.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(description) } }] }))
    })
  })
  await new Promise<void>((resolve) => cloudflare.listen(CLOUDFLARE_PORT, resolve))
})
afterAll(() => cloudflare.close())
beforeEach(() => {
  quotaUsedUp = false
})

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  server: true,
  setupTimeout: 180_000,
  env: {
    CF_API_BASE: `http://localhost:${CLOUDFLARE_PORT}/v4`,
    CF_ACCOUNT_ID: 'test-account',
    CF_API_TOKEN: 'test-token',
    TURNSTILE_SECRET_KEY: 'test-secret',
    TURNSTILE_VERIFY_URL: `http://localhost:${CLOUDFLARE_PORT}/siteverify`,
  },
})

const generationForm = (overrides: Record<string, string> = {}) => {
  const form = new FormData()
  form.append('photo', new Blob(['before'], { type: 'image/jpeg' }), 'photo.jpg')
  const fields = { width: '1024', height: '672', roomType: 'living-room', style: 'japandi', seed: '1', ...overrides }
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return form
}

/** Sends what the app sends: a same-origin request with a Turnstile token. */
const post = (path: string, body: FormData, options: { origin?: string | null; token?: string | null } = {}) => {
  const { origin = new URL(url('/')).origin, token = VALID_TOKEN } = options
  if (token) body.append('turnstileToken', token)
  return fetch(url(path), { method: 'POST', body, headers: origin ? { Origin: origin } : {} })
}

const codeOf = async (response: Response) => (await response.json()).data.code

describe('request guard', () => {
  it.each([
    ['without an Origin header', { origin: null }],
    ['from another site', { origin: 'https://evil.example' }],
    ['without a Turnstile token', { token: null }],
    ['with a Turnstile token that fails verification', { token: 'bot' }],
  ])('rejects a request %s as 403 VERIFICATION_FAILED', async (_, options) => {
    for (const path of ['/api/photo-check', '/api/generations']) {
      const response = await post(path, generationForm(), options)
      expect(response.status).toBe(403)
      expect(await codeOf(response)).toBe('VERIFICATION_FAILED')
    }
  })

  it('rejects a body over 4 MB before reading it', async () => {
    const form = generationForm()
    form.set('photo', new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], { type: 'image/jpeg' }), 'photo.jpg')
    const response = await post('/api/generations', form)
    expect(response.status).toBe(400)
    expect(await codeOf(response)).toBe('INVALID_FILE')
  })
})

describe('security headers', () => {
  it('serves the page with a CSP that allows exactly its inline scripts', async () => {
    const response = await fetch(url('/'))
    const html = await response.text()
    const policy = response.headers.get('content-security-policy')!
    const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter(Boolean)
    expect(inline.length).toBeGreaterThan(0)
    for (const source of inline) {
      expect(policy).toContain(`'sha256-${createHash('sha256').update(source!).digest('base64')}'`)
    }
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).not.toContain('unsafe-inline')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })
})

describe('POST /api/photo-check', () => {
  it('rejects a request without a photo', async () => {
    const response = await post('/api/photo-check', new FormData())
    expect(response.status).toBe(400)
    expect((await response.json()).data.code).toBe('INVALID_FILE')
  })
})

describe('POST /api/generations', () => {
  it('rejects an unknown style', async () => {
    const response = await post('/api/generations', generationForm({ style: 'boho' }))
    expect(response.status).toBe(400)
    expect((await response.json()).data.code).toBe('INVALID_FILE')
  })

  it('reports a used-up quota as 429 QUOTA_REACHED', async () => {
    quotaUsedUp = true
    const response = await post('/api/generations', generationForm())
    expect(response.status).toBe(429)
    expect((await response.json()).data.code).toBe('QUOTA_REACHED')
  })

  it('returns the restyled image with its description', async () => {
    const response = await post('/api/generations', generationForm())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(Buffer.from(body.image, 'base64').toString()).toBe('after')
    expect(body.description).toEqual(description)
  })
})
