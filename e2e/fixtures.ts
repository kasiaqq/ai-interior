import { deflateSync } from 'node:zlib'
import type { Page } from '@playwright/test'

/** A plain 800×600 PNG — enough for the browser to decode, scale and crop like a real photo. */
export function roomPhoto(): { name: string; mimeType: string; buffer: Buffer } {
  const width = 800
  const height = 600
  const row = Buffer.alloc(1 + width * 3)
  for (let x = 0; x < width; x++) row.set([200, 190, 170], 1 + x * 3)
  const raw = Buffer.concat(Array.from({ length: height }, () => row))

  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (data: Buffer) => {
    let c = 0xffffffff
    for (const byte of data) c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data])
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const checksum = Buffer.alloc(4)
    checksum.writeUInt32BE(crc(body))
    return Buffer.concat([length, body, checksum])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 2, 0, 0, 0], 8)

  const buffer = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return { name: 'living-room.png', mimeType: 'image/png', buffer }
}

const description = {
  palette: [
    { role: 'Paper walls', hex: '#F5E9DC' },
    { role: 'Oak floor', hex: '#C39A6B' },
    { role: 'Sage', hex: '#8C9784' },
  ],
  keyPieces: ['Low sage sofa'],
  changes: ['Carpet replaced with oak'],
  kept: ['Window position, shape and frame colour'],
  summary: 'Warm paper walls and a wide oak floor.',
}

/** Stands in for Cloudflare's Turnstile script: every challenge passes at once. */
const FAKE_TURNSTILE = `window.turnstile = {
  render: (container, options) => { window.__turnstileOptions = options; return 'e2e' },
  reset: () => {},
  execute: () => setTimeout(() => window.__turnstileOptions.callback('e2e-token')),
}`

/** Answers both API routes in the browser, so no test spends the shared model quota. */
export async function stubApi(page: Page, options: { quotaUsedUp?: boolean } = {}) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_TURNSTILE }),
  )
  await page.route('**/api/photo-check', (route) =>
    route.fulfill({ json: { verdict: 'ok', warnings: [], positives: ['Wide shot'] } }),
  )
  await page.route('**/api/generations', (route) =>
    options.quotaUsedUp
      ? route.fulfill({ status: 429, json: { statusCode: 429, data: { code: 'QUOTA_REACHED' } } })
      : route.fulfill({ json: { image: roomPhoto().buffer.toString('base64'), description } }),
  )
}

/** Upload → room → style → generate, ending on the result (or the error) screen. */
export async function generateJapandi(page: Page) {
  await page.goto('/')
  await page.locator('input[type="file"]').setInputFiles(roomPhoto())
  await page.getByText('Living room', { exact: true }).click()
  await page.getByRole('button', { name: 'Continue to styles' }).click()
  await page.locator('label', { hasText: 'Japandi' }).click()
  await page.getByRole('button', { name: 'Generate Japandi' }).click()
}
