import { AppError } from '#shared/errors'

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string
  execute(widgetId: string): void
  reset(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let widget: Promise<{ api: TurnstileApi; id: string }> | null = null
let settle: { resolve: (token: string) => void; reject: () => void } | null = null
let queue: Promise<unknown> = Promise.resolve()

function loadScript(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject())
    script.onerror = reject
    document.head.append(script)
  })
}

/** One invisible widget for the app; it only shows itself when Cloudflare asks for an interaction. */
async function createWidget() {
  const api = await loadScript()
  const container = document.createElement('div')
  container.className = 'turnstile'
  document.body.append(container)
  const id = api.render(container, {
    sitekey: useRuntimeConfig().public.turnstileSiteKey,
    execution: 'execute',
    appearance: 'interaction-only',
    callback: (token: string) => settle?.resolve(token),
    'error-callback': () => settle?.reject(),
  })
  return { api, id }
}

/** A fresh single-use token per API call; calls wait for each other because the widget holds one token at a time. */
export function turnstileToken(): Promise<string> {
  const next = queue.then(async () => {
    widget ??= createWidget().catch((error) => {
      widget = null
      throw error
    })
    const { api, id } = await widget
    const token = new Promise<string>((resolve, reject) => (settle = { resolve, reject }))
    api.reset(id)
    api.execute(id)
    return token
  })
  queue = next.catch(() => {})
  return next.catch(() => {
    throw new AppError('VERIFICATION_FAILED')
  })
}
