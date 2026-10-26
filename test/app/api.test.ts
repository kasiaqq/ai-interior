import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '#shared/errors'
import { checkPhoto, requestGeneration } from '~/utils/api'

const fetchMock = vi.fn()
const input = { photo: new Blob(['p']), width: 1024, height: 672, roomType: 'kitchen' as const, style: 'japandi' as const, seed: 5 }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const codeOf = async (promise: Promise<unknown>) => ((await promise.catch((e) => e)) as AppError).code

beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('requestGeneration', () => {
  it('posts the form and decodes the image', async () => {
    fetchMock.mockResolvedValue(json({ image: btoa('jpeg'), description: null }))
    const signal = new AbortController().signal
    const result = await requestGeneration({ ...input, problem: 'door' }, signal)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/generations')
    expect(init.signal).toBe(signal)
    const form = init.body as FormData
    expect(Object.fromEntries([...form.entries()].filter(([k]) => k !== 'photo'))).toEqual({
      width: '1024',
      height: '672',
      roomType: 'kitchen',
      style: 'japandi',
      seed: '5',
      problem: 'door',
    })
    expect(result.blob.type).toBe('image/jpeg')
    expect(await result.blob.text()).toBe('jpeg')
    expect(result.description).toBeNull()
  })

  it('maps the server error code', async () => {
    fetchMock.mockResolvedValue(json({ statusCode: 429, data: { code: 'QUOTA_REACHED' } }, 429))
    expect(await codeOf(requestGeneration(input, new AbortController().signal))).toBe('QUOTA_REACHED')
  })

  it('maps an unknown server failure to GENERATION_FAILED', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 504 }))
    expect(await codeOf(requestGeneration(input, new AbortController().signal))).toBe('GENERATION_FAILED')
  })

  it('maps a network failure to NETWORK', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await codeOf(requestGeneration(input, new AbortController().signal))).toBe('NETWORK')
  })

  it('rethrows an abort untouched', async () => {
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))
    const error = await requestGeneration(input, new AbortController().signal).catch((e) => e)
    expect(error.name).toBe('AbortError')
  })
})

describe('checkPhoto', () => {
  it('returns the analysis', async () => {
    const analysis = { verdict: 'ok', warnings: [], positives: ['daylight'] }
    fetchMock.mockResolvedValue(json(analysis))
    expect(await checkPhoto(new Blob(['p']))).toEqual(analysis)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/photo-check')
  })
})
