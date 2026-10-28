import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConfirmDialog from '~/components/layout/ConfirmDialog.vue'
import PhotoCheckPanel from '~/components/upload/PhotoCheckPanel.vue'
import PhotoDropzone from '~/components/upload/PhotoDropzone.vue'
import IndexPage from '~/pages/index.vue'
import { useSessionStore } from '~/stores/session'
import { checkPhoto } from '~/utils/api'
import { normalizePhoto } from '~/utils/normalize-photo'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)
vi.mock('~/utils/api', () => ({ checkPhoto: vi.fn() }))
vi.mock('~/utils/normalize-photo', () => ({ normalizePhoto: vi.fn() }))

const normalize = vi.mocked(normalizePhoto)
const check = vi.mocked(checkPhoto)
const flush = () => new Promise((r) => setTimeout(r, 0))
const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' })
const normalized = (label: string) => ({ blob: new Blob([label]), width: 1024, height: 672 })

beforeEach(() => {
  // Node's URL.createObjectURL rejects happy-dom's Blob; the page only needs some URL back.
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${Math.random()}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  useSessionStore().$reset()
  navigateToMock.mockReset()
  normalize.mockReset()
  check.mockReset()
  normalize.mockImplementation(async (f) => normalized(f.name))
})

const dropFile = async (wrapper: Awaited<ReturnType<typeof mountSuspended>>, f: File) => {
  wrapper.findComponent(PhotoDropzone).vm.$emit('file', f)
  await flush()
}

describe('upload step', () => {
  it('goes on to the room step when the photo looks fine', async () => {
    check.mockResolvedValue({ verdict: 'ok', warnings: [], positives: ['daylight'] })
    const wrapper = await mountSuspended(IndexPage)
    await dropFile(wrapper, file('room.jpg'))
    expect(navigateToMock).toHaveBeenCalledWith('/room')
    expect(wrapper.findComponent(PhotoCheckPanel).exists()).toBe(false)
  })

  it('shows the warning and stays when the photo may be hard', async () => {
    check.mockResolvedValue({ verdict: 'warning', warnings: ['The left wall is cut off'], positives: [] })
    const wrapper = await mountSuspended(IndexPage)
    await dropFile(wrapper, file('room.jpg'))
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('The left wall is cut off')
    expect(wrapper.text()).toContain('Continue anyway')
  })

  it('asks before a new photo replaces existing results', async () => {
    check.mockResolvedValue({ verdict: 'ok', warnings: [], positives: [] })
    const session = useSessionStore()
    session.setPhoto({ ...normalized('old'), fileName: 'old.jpg', fileSize: 1 })
    session.addResult({ style: 'japandi', roomType: 'kitchen', blob: new Blob(['r']), description: null })
    const wrapper = await mountSuspended(IndexPage)

    await dropFileThroughInput(wrapper, file('new.jpg'))

    expect(wrapper.findComponent(ConfirmDialog).props('open')).toBe(true)
    expect(session.photo?.fileName).toBe('old.jpg')
    wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flush()
    expect(session.photo?.fileName).toBe('new.jpg')
    expect(session.results).toHaveLength(0)
  })

  it('keeps the photo picked last when an earlier one finishes decoding later', async () => {
    check.mockResolvedValue({ verdict: 'warning', warnings: ['Low light'], positives: [] })
    let finishFirst!: () => void
    normalize.mockImplementationOnce(
      (f) => new Promise((resolve) => (finishFirst = () => resolve(normalized(f.name)))),
    )
    const wrapper = await mountSuspended(IndexPage)
    wrapper.findComponent(PhotoDropzone).vm.$emit('file', file('first.jpg'))
    await dropFile(wrapper, file('second.jpg'))
    finishFirst()
    await flush()
    expect(useSessionStore().photo?.fileName).toBe('second.jpg')
  })
})

async function dropFileThroughInput(wrapper: Awaited<ReturnType<typeof mountSuspended>>, f: File) {
  const input = wrapper.get('input[type="file"]').element as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [f], configurable: true })
  input.dispatchEvent(new Event('change'))
  await flush()
}
