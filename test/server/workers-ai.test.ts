import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '#shared/errors'
import { runImageEdit, runVisionChat } from '../../server/utils/workers-ai'

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const image = new Uint8Array([1, 2, 3])
const imageInput = { image, prompt: 'p', width: 1024, height: 672, seed: 7 }

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('CF_ACCOUNT_ID', 'acc')
  vi.stubEnv('CF_API_TOKEN', 'tok')
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const errorCode = async (promise: Promise<unknown>) => {
  const error = await promise.catch((e) => e)
  expect(error).toBeInstanceOf(AppError)
  return (error as AppError).code
}

describe('runImageEdit', () => {
  it('sends the five multipart fields with a bearer token to klein 4B', async () => {
    fetchMock.mockResolvedValue(json({ success: true, result: { image: Buffer.from('out').toString('base64') } }))
    const result = await runImageEdit(imageInput)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/acc/ai/run/@cf/black-forest-labs/flux-2-klein-4b')
    expect(init.headers.Authorization).toBe('Bearer tok')
    const form = init.body as FormData
    expect(form.get('prompt')).toBe('p')
    expect(form.get('width')).toBe('1024')
    expect(form.get('height')).toBe('672')
    expect(form.get('seed')).toBe('7')
    expect((form.get('input_image_0') as Blob).type).toBe('image/jpeg')
    expect(Buffer.from(result).toString()).toBe('out')
  })

  it('maps HTTP 429 to QUOTA_REACHED', async () => {
    fetchMock.mockResolvedValue(json({ success: false, errors: [{ code: 4006 }] }, 429))
    expect(await errorCode(runImageEdit(imageInput))).toBe('QUOTA_REACHED')
  })

  it('maps error code 4006 to QUOTA_REACHED whatever the status', async () => {
    fetchMock.mockResolvedValue(json({ success: false, errors: [{ code: 4006 }] }, 400))
    expect(await errorCode(runImageEdit(imageInput))).toBe('QUOTA_REACHED')
  })

  it('maps a server error to GENERATION_FAILED', async () => {
    fetchMock.mockResolvedValue(json({ success: false, errors: [{ code: 3043 }] }, 500))
    expect(await errorCode(runImageEdit(imageInput))).toBe('GENERATION_FAILED')
  })

  it('maps success:false with HTTP 200 to GENERATION_FAILED', async () => {
    fetchMock.mockResolvedValue(json({ success: false, errors: [] }))
    expect(await errorCode(runImageEdit(imageInput))).toBe('GENERATION_FAILED')
  })
})

describe('runVisionChat', () => {
  it('returns the message content from Mistral Small 3.1', async () => {
    fetchMock.mockResolvedValue(json({ choices: [{ message: { content: '{"a":1}' } }] }))
    expect(await runVisionChat({ prompt: 'q', images: [image], maxTokens: 400 })).toBe('{"a":1}')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.cloudflare.com/client/v4/accounts/acc/ai/v1/chat/completions')
    expect(body.model).toBe('@cf/mistralai/mistral-small-3.1-24b-instruct')
    expect(body.max_tokens).toBe(400)
  })

  it('sends every image as a JPEG data URL after the text', async () => {
    fetchMock.mockResolvedValue(json({ choices: [{ message: { content: 'x' } }] }))
    await runVisionChat({ prompt: 'q', images: [image, image], maxTokens: 700 })
    const content = JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content
    expect(content[0]).toEqual({ type: 'text', text: 'q' })
    expect(content.slice(1)).toHaveLength(2)
    expect(content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('maps HTTP 429 to QUOTA_REACHED', async () => {
    fetchMock.mockResolvedValue(json({ errors: [{ code: 4006 }] }, 429))
    expect(await errorCode(runVisionChat({ prompt: 'q', images: [], maxTokens: 1 }))).toBe('QUOTA_REACHED')
  })

  it('maps a missing message to GENERATION_FAILED', async () => {
    fetchMock.mockResolvedValue(json({ choices: [] }))
    expect(await errorCode(runVisionChat({ prompt: 'q', images: [], maxTokens: 1 }))).toBe('GENERATION_FAILED')
  })
})
