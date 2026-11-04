import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '#shared/errors'
import { generateRestyle, parseGenerationForm, statusFor } from '../../server/utils/generate'
import { runImageEdit, runVisionChat } from '../../server/utils/workers-ai'

vi.mock('../../server/utils/workers-ai', () => ({ runImageEdit: vi.fn(), runVisionChat: vi.fn() }))
const image = vi.mocked(runImageEdit)
const chat = vi.mocked(runVisionChat)

const photo = new Uint8Array([1])
const fields = { width: '1024', height: '672', roomType: 'living-room', style: 'japandi', seed: '42' }
const description = {
  palette: [
    { role: 'Paper walls', hex: '#F5E9DC' },
    { role: 'Oak floor', hex: '#D2B48C' },
    { role: 'Sage', hex: '#8C9784' },
  ],
  keyPieces: ['Low oak bench'],
  changes: ['Carpet replaced with oak'],
  kept: ['Window'],
  summary: 'A calm Japandi room.',
}

const codeOf = (fn: () => unknown) => {
  try {
    fn()
  } catch (error) {
    return (error as AppError).code
  }
  return 'no error'
}

beforeEach(() => {
  image.mockReset()
  chat.mockReset()
  image.mockResolvedValue(new Uint8Array([9, 9]))
})

describe('parseGenerationForm', () => {
  it('reads a valid form', () => {
    expect(parseGenerationForm(fields, photo)).toEqual({
      photo,
      width: 1024,
      height: 672,
      roomType: 'living-room',
      style: 'japandi',
      seed: 42,
      problem: undefined,
    })
  })

  it('rejects a missing photo', () => {
    expect(codeOf(() => parseGenerationForm(fields, undefined))).toBe('INVALID_FILE')
  })

  it('rejects an unknown style, room type or problem', () => {
    expect(codeOf(() => parseGenerationForm({ ...fields, style: 'boho' }, photo))).toBe('INVALID_FILE')
    expect(codeOf(() => parseGenerationForm({ ...fields, roomType: 'garage' }, photo))).toBe('INVALID_FILE')
    expect(codeOf(() => parseGenerationForm({ ...fields, problem: 'ceiling' }, photo))).toBe('INVALID_FILE')
  })

  it('rejects sizes that are not multiples of 16', () => {
    expect(codeOf(() => parseGenerationForm({ ...fields, width: '1000' }, photo))).toBe('INVALID_FILE')
  })
})

describe('generateRestyle', () => {
  const input = parseGenerationForm({ ...fields, problem: 'window' }, photo)

  it('passes size and seed through unchanged and returns image with description', async () => {
    chat.mockResolvedValue(JSON.stringify(description))
    const result = await generateRestyle(input)
    expect(image).toHaveBeenCalledWith(expect.objectContaining({ image: photo, width: 1024, height: 672, seed: 42 }))
    expect(Buffer.from(result.image, 'base64')).toEqual(Buffer.from([9, 9]))
    expect(result.description).toEqual(description)
  })

  it('describes the before and after images under the style name', async () => {
    chat.mockResolvedValue(JSON.stringify(description))
    await generateRestyle(input)
    const call = chat.mock.calls[0][0]
    expect(call.prompt).toContain('Japandi')
    expect(call.images).toEqual([photo, new Uint8Array([9, 9])])
    expect(call.maxTokens).toBe(700)
  })

  it('returns the image without description when the description is junk', async () => {
    chat.mockResolvedValue('Here is a lovely room.')
    expect((await generateRestyle(input)).description).toBeNull()
  })

  it('returns the image without description when the description call fails', async () => {
    chat.mockRejectedValue(new AppError('QUOTA_REACHED'))
    expect((await generateRestyle(input)).description).toBeNull()
  })

  it('fails with the image error', async () => {
    image.mockRejectedValue(new AppError('QUOTA_REACHED'))
    await expect(generateRestyle(input)).rejects.toMatchObject({ code: 'QUOTA_REACHED' })
  })
})

describe('statusFor', () => {
  it('maps codes to HTTP statuses', () => {
    expect(statusFor('QUOTA_REACHED')).toBe(429)
    expect(statusFor('INVALID_FILE')).toBe(400)
    expect(statusFor('GENERATION_FAILED')).toBe(502)
  })
})
