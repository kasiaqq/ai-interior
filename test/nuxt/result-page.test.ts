import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReportProblemDialog from '~/components/result/ReportProblemDialog.vue'
import ResultPage from '~/pages/result/[id].vue'
import { useSessionStore } from '~/stores/session'
import { requestGeneration } from '~/utils/api'

vi.mock('~/utils/api', () => ({ requestGeneration: vi.fn(), checkPhoto: vi.fn() }))
const request = vi.mocked(requestGeneration)
const flush = () => new Promise((r) => setTimeout(r, 0))

const description = {
  palette: [
    { role: 'Paper walls', hex: '#F5E9DC' },
    { role: 'Oak floor', hex: '#C39A6B' },
    { role: 'Sage', hex: '#8C9784' },
  ],
  keyPieces: ['Low sage sofa'],
  changes: ['Carpet replaced with oak'],
  kept: ['Radiator under the window'],
  summary: 'A calm room.',
}

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${Math.random()}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  request.mockReset()
  request.mockImplementation(() => new Promise(() => {}))
  useGeneration().cancel()
  const session = useSessionStore()
  session.setPhoto({ blob: new Blob(['p']), fileName: 'a.jpg', fileSize: 1, width: 1024, height: 672 })
  session.setRoomType('living-room')
  session.setStyle('japandi')
})

const openResult = (withDescription = true) => {
  const result = useSessionStore().addResult({
    style: 'japandi',
    roomType: 'living-room',
    blob: new Blob(['r']),
    description: withDescription ? description : null,
  })
  return mountSuspended(ResultPage, { route: `/result/${result.id}` })
}

describe('result step', () => {
  it('runs again with the reported problem and counts the try', async () => {
    const wrapper = await openResult()
    wrapper.findComponent(ReportProblemDialog).vm.$emit('retry', 'door')
    await flush()
    expect(request.mock.calls[0]![0]).toMatchObject({ style: 'japandi', problem: 'door' })
    expect(useSessionStore().reportCount).toBe(1)
  })

  it('suggests another photo from the third try on', async () => {
    useSessionStore().registerReport()
    useSessionStore().registerReport()
    const wrapper = await openResult()
    expect(wrapper.findComponent(ReportProblemDialog).props('showHint')).toBe(true)
  })

  it('still shows the image when the description is missing', async () => {
    const wrapper = await openResult(false)
    expect(wrapper.find('img[alt="Your room restyled"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Details unavailable')
    expect(wrapper.text()).not.toContain('Copy details')
  })

  it('says so when copying to the clipboard fails', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    const wrapper = await openResult()
    const copy = wrapper.findAll('button').find((b) => b.text().includes('Copy details'))!
    await copy.trigger('click')
    await flush()
    expect(copy.text()).toContain('Couldn’t copy')
  })
})
