import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '#shared/errors'
import { normalizePhoto, targetSize } from '~/utils/normalize-photo'

describe('targetSize', () => {
  it.each([
    [2048, 1365, 1024, 672],
    [1000, 667, 992, 656],
    [525, 700, 512, 688],
    [300, 200, 288, 192],
  ])('%ix%i → %ix%i', (w, h, ew, eh) => {
    expect(targetSize(w, h)).toEqual({ width: ew, height: eh })
  })

  it('never returns zero', () => {
    const size = targetSize(4000, 20)
    expect(size.width % 16).toBe(0)
    expect(size.height).toBeGreaterThan(0)
  })
})

describe('normalizePhoto', () => {
  const createImageBitmap = vi.fn()
  const drawImage = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('createImageBitmap', createImageBitmap)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
      callback(new Blob(['jpeg'], { type }))
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    createImageBitmap.mockReset()
    drawImage.mockReset()
  })

  const file = (type = 'image/jpeg', size = 10) => new File([new Uint8Array(size)], 'room.jpg', { type })
  const codeOf = async (promise: Promise<unknown>) => ((await promise.catch((e) => e)) as AppError).code

  it('returns a JPEG of the target size, honouring EXIF orientation', async () => {
    createImageBitmap.mockResolvedValue({ width: 2048, height: 1365, close: vi.fn() })
    const result = await normalizePhoto(file())
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(File), { imageOrientation: 'from-image' })
    expect(result.width).toBe(1024)
    expect(result.height).toBe(672)
    expect(result.blob.type).toBe('image/jpeg')
  })

  it('crops the centre of the photo', async () => {
    createImageBitmap.mockResolvedValue({ width: 1000, height: 667, close: vi.fn() })
    await normalizePhoto(file())
    const [, sx, sy, sw, sh, dx, dy, dw, dh] = drawImage.mock.calls[0]
    expect([sx, sy, sw, sh]).toEqual([4, 5.5, 992, 656])
    expect([dx, dy, dw, dh]).toEqual([0, 0, 992, 656])
  })

  it('rejects files over 20 MB', async () => {
    expect(await codeOf(normalizePhoto(file('image/jpeg', 20 * 1024 * 1024 + 1)))).toBe('INVALID_FILE')
  })

  it('rejects non-images', async () => {
    expect(await codeOf(normalizePhoto(file('text/plain')))).toBe('INVALID_FILE')
  })

  it('rejects photos the browser cannot decode, such as HEIC outside Safari', async () => {
    createImageBitmap.mockRejectedValue(new DOMException('decode failed'))
    expect(await codeOf(normalizePhoto(file('image/heic')))).toBe('INVALID_FILE')
  })

  it('rejects photos whose short side ends up under 256 px', async () => {
    createImageBitmap.mockResolvedValue({ width: 4000, height: 500, close: vi.fn() })
    expect(await codeOf(normalizePhoto(file()))).toBe('INVALID_FILE')
  })
})
