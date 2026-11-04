import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '#shared/errors'
import { createGeneration, ESTIMATED_SECONDS, progressAt } from '~/composables/useGeneration'
import { useSessionStore } from '~/stores/session'
import { requestGeneration } from '~/utils/api'

vi.mock('~/utils/api', () => ({ requestGeneration: vi.fn() }))
const request = vi.mocked(requestGeneration)

const deferred = () => {
  let resolve!: (value: { blob: Blob; description: null }) => void
  const promise = new Promise<{ blob: Blob; description: null }>((r) => (resolve = r))
  return { promise, resolve: () => resolve({ blob: new Blob(['after']), description: null }) }
}
const flush = () => new Promise((r) => setTimeout(r, 0))

let session: ReturnType<typeof useSessionStore>

beforeEach(() => {
  setActivePinia(createPinia())
  request.mockReset()
  session = useSessionStore()
  session.setPhoto({ blob: new Blob(['p']), fileName: 'a.jpg', fileSize: 1, width: 1024, height: 672 })
  session.setRoomType('kitchen')
  session.setStyle('japandi')
})

describe('createGeneration', () => {
  it('runs and stores the result', async () => {
    request.mockResolvedValue({ blob: new Blob(['after']), description: null })
    const generation = createGeneration()
    generation.start()
    expect(generation.state.value.status).toBe('running')
    await flush()
    expect(session.results).toHaveLength(1)
    expect(generation.state.value).toEqual({ status: 'done', resultId: session.results[0]!.id })
  })

  it('sends the session photo and choices with the reported problem', async () => {
    request.mockResolvedValue({ blob: new Blob(['after']), description: null })
    createGeneration().start({ problem: 'window' })
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ photo: session.photo!.blob, width: 1024, height: 672, roomType: 'kitchen', style: 'japandi', problem: 'window' }),
      expect.any(AbortSignal),
    )
  })

  it('uses a new seed for every run', async () => {
    request.mockResolvedValue({ blob: new Blob(['after']), description: null })
    const generation = createGeneration()
    generation.start()
    await flush()
    generation.start()
    await flush()
    const seeds = request.mock.calls.map(([input]) => input.seed)
    expect(seeds[0]).not.toBe(seeds[1])
  })

  it('ignores start while already running', () => {
    request.mockReturnValue(deferred().promise)
    const generation = createGeneration()
    generation.start()
    generation.start()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('aborts the request on cancel', () => {
    request.mockReturnValue(deferred().promise)
    const generation = createGeneration()
    generation.start()
    generation.cancel()
    expect((request.mock.calls[0]![1] as AbortSignal).aborted).toBe(true)
    expect(generation.state.value.status).toBe('cancelled')
  })

  it('discards a response that arrives after cancel and a new start', async () => {
    const first = deferred()
    const second = deferred()
    request.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const generation = createGeneration()
    generation.start()
    generation.cancel()
    generation.start()
    first.resolve()
    await flush()
    expect(session.results).toHaveLength(0)
    second.resolve()
    await flush()
    expect(session.results).toHaveLength(1)
  })

  it('drops a result whose photo was replaced while it ran', async () => {
    const run = deferred()
    request.mockReturnValue(run.promise)
    const generation = createGeneration()
    generation.start()
    session.setPhoto({ blob: new Blob(['other']), fileName: 'b.jpg', fileSize: 1, width: 1024, height: 672 })
    run.resolve()
    await flush()
    expect(session.results).toHaveLength(0)
    expect(generation.state.value.status).toBe('cancelled')
  })

  it('retries a failed run with the same reported problem', async () => {
    request.mockRejectedValueOnce(new AppError('GENERATION_FAILED'))
    request.mockResolvedValueOnce({ blob: new Blob(['after']), description: null })
    const generation = createGeneration()
    generation.start({ problem: 'door' })
    await flush()
    generation.retry()
    expect(request.mock.calls[1]![0].problem).toBe('door')
  })

  it('fails with the error code and leaves the session intact', async () => {
    const done = session.addResult({ style: 'japandi', roomType: 'kitchen', blob: new Blob(['r']), description: null })
    request.mockRejectedValue(new AppError('QUOTA_REACHED'))
    const generation = createGeneration()
    generation.start()
    await flush()
    expect(generation.state.value).toEqual({ status: 'failed', code: 'QUOTA_REACHED' })
    expect(session.photo).not.toBeNull()
    expect(session.results).toEqual([done])
  })
})

describe('progressAt', () => {
  it('fills linearly and stops at 90 % until the result arrives', () => {
    expect(progressAt(0).ratio).toBe(0)
    expect(progressAt(ESTIMATED_SECONDS / 2).ratio).toBe(0.5)
    expect(progressAt(ESTIMATED_SECONDS * 1.5).ratio).toBe(0.9)
  })

  it('moves through the three stages in thirds of the estimate', () => {
    expect(progressAt(0).stage).toBe(0)
    expect(progressAt(ESTIMATED_SECONDS / 2).stage).toBe(1)
    expect(progressAt(ESTIMATED_SECONDS).stage).toBe(2)
  })

  it('counts the seconds left down to zero', () => {
    expect(progressAt(0).secondsLeft).toBe(ESTIMATED_SECONDS)
    expect(progressAt(ESTIMATED_SECONDS * 2).secondsLeft).toBe(0)
  })
})
