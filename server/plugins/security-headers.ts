import { createHash } from 'node:crypto'

const TURNSTILE = 'https://challenges.cloudflare.com'

const sha256 = (source: string) => `'sha256-${createHash('sha256').update(source).digest('base64')}'`

/** Nuxt inlines the import map and runtime config, which change per build and env, so they are hashed per response. */
export function contentSecurityPolicy(html: string): string {
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1]!)
    .filter(Boolean)
  return [
    "default-src 'self'",
    `script-src 'self' ${TURNSTILE} ${inlineScripts.map(sha256).join(' ')}`,
    "style-src 'self'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    `frame-src ${TURNSTILE}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export default defineNitroPlugin((nitro) => {
  // Vite's dev server injects inline styles and an HMR socket that this policy would block.
  if (import.meta.dev) return
  nitro.hooks.hook('render:response', (response) => {
    if (typeof response.body !== 'string') return
    response.headers = {
      ...response.headers,
      'Content-Security-Policy': contentSecurityPolicy(response.body),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
    }
  })
})
