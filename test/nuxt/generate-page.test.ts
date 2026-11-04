import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '#shared/errors'
import App from '~/app.vue'
import { useSessionStore } from '~/stores/session'
import { requestGeneration } from '~/utils/api'

vi.mock('~/utils/api', () => ({ requestGeneration: vi.fn(), checkPhoto: vi.fn() }))
const request = vi.mocked(requestGeneration)
const flush = () => new Promise((r) => setTimeout(r, 0))
const routeBecomes = async (path: string) => {
  const router = useRouter()
  for (let i = 0; i < 50 && router.currentRoute.value.path !== path; i++) await new Promise((r) => setTimeout(r, 10))
  return router.currentRoute.value.path
}

/** A request that only ends when aborted, like a slow model call. */
const pending = () =>
  request.mockImplementation(
    (_input, signal) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))),
      ),
  )

beforeEach(async () => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${Math.random()}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  request.mockReset()
  useGeneration().cancel()
  const session = useSessionStore()
  session.setPhoto({ blob: new Blob(['p']), fileName: 'a.jpg', fileSize: 1, width: 1024, height: 672 })
  session.setRoomType('living-room')
  session.setStyle('japandi')
  await useRouter().replace('/room')
})

async function openGenerating() {
  const wrapper = await mountSuspended(App, { route: '/room' })
  const router = useRouter()
  await router.push('/style')
  useGeneration().start()
  await router.push('/generate')
  await flush()
  return { wrapper, router }
}

describe('generating step', () => {
  it('ends the run when the user leaves for another step', async () => {
    pending()
    const { router } = await openGenerating()
    await router.push('/room')
    await flush()
    expect((request.mock.calls[0]![1] as AbortSignal).aborted).toBe(true)
    expect(useGeneration().state.value.status).toBe('cancelled')
  })

  it('offers no retry once the daily quota is used up', async () => {
    request.mockRejectedValue(new AppError('QUOTA_REACHED'))
    const { wrapper } = await openGenerating()
    expect(wrapper.text()).toContain('Come back tomorrow')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(false)
  })

  it('returns to the style step with one Back press left to the room step', async () => {
    pending()
    const { wrapper, router } = await openGenerating()
    await wrapper.get('.generating .btn').trigger('click')
    expect(await routeBecomes('/style')).toBe('/style')
    router.back()
    expect(await routeBecomes('/room')).toBe('/room')
  })
})
