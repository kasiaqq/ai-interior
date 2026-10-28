import { createServer, type Server } from 'node:http'
import { fileURLToPath } from 'node:url'
import { setup, url } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

/** Stands in for Cloudflare so the real routes run end to end without spending quota. */
const CLOUDFLARE_PORT = 4599
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
    request.resume()
    request.on('end', () => {
      response.setHeader('Content-Type', 'application/json')
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
  },
})

const generationForm = (overrides: Record<string, string> = {}) => {
  const form = new FormData()
  form.append('photo', new Blob(['before'], { type: 'image/jpeg' }), 'photo.jpg')
  const fields = { width: '1024', height: '672', roomType: 'living-room', style: 'japandi', seed: '1', ...overrides }
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return form
}

const post = (path: string, body: FormData) => fetch(url(path), { method: 'POST', body })

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
