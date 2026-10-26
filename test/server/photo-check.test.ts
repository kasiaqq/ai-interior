import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '#shared/errors'
import { checkPhotoQuality } from '../../server/utils/photo-check'
import { runVisionChat } from '../../server/utils/workers-ai'

vi.mock('../../server/utils/workers-ai', () => ({ runVisionChat: vi.fn() }))
const chat = vi.mocked(runVisionChat)
const photo = new Uint8Array([1])
const PASS = { verdict: 'ok', warnings: [], positives: [] }

beforeEach(() => {
  chat.mockReset()
})

describe('checkPhotoQuality', () => {
  it('returns a valid analysis as is', async () => {
    const analysis = { verdict: 'warning', warnings: ['The left wall is cut off'], positives: ['Daylight'] }
    chat.mockResolvedValue(JSON.stringify(analysis))
    expect(await checkPhotoQuality(photo)).toEqual(analysis)
  })

  it('sends the photo with a 400-token budget', async () => {
    chat.mockResolvedValue(JSON.stringify(PASS))
    await checkPhotoQuality(photo)
    expect(chat).toHaveBeenCalledWith(expect.objectContaining({ images: [photo], maxTokens: 400 }))
  })

  it('treats a warning without reasons as ok', async () => {
    chat.mockResolvedValue('{"verdict":"warning","warnings":[],"positives":["wide shot"]}')
    expect(await checkPhotoQuality(photo)).toEqual({ verdict: 'ok', warnings: [], positives: ['wide shot'] })
  })

  it('fills in missing lists', async () => {
    chat.mockResolvedValue('{"verdict":"ok"}')
    expect(await checkPhotoQuality(photo)).toEqual(PASS)
  })

  it('lets the user through when the reply is not JSON', async () => {
    chat.mockResolvedValue('The photo shows a bedroom.')
    expect(await checkPhotoQuality(photo)).toEqual(PASS)
  })

  it('lets the user through when the model call fails, quota included', async () => {
    chat.mockRejectedValue(new AppError('QUOTA_REACHED'))
    expect(await checkPhotoQuality(photo)).toEqual(PASS)
  })
})
