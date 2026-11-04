import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppHeader from '~/components/layout/AppHeader.vue'
import ConfirmDialog from '~/components/layout/ConfirmDialog.vue'
import { useSessionStore } from '~/stores/session'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${Math.random()}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  navigateToMock.mockReset()
  const session = useSessionStore()
  session.setPhoto({ blob: new Blob(['p']), fileName: 'a.jpg', fileSize: 1, width: 1024, height: 672 })
  session.addResult({ style: 'japandi', roomType: 'kitchen', blob: new Blob(['r']), description: null })
})

const startOverButton = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
  wrapper.findAll('button').find((b: { text(): string }) => b.text() === 'Start over')!

describe('header', () => {
  it('asks before Start over clears the session', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/results' })
    await startOverButton(wrapper).trigger('click')
    expect(wrapper.findComponent(ConfirmDialog).props('open')).toBe(true)
    expect(useSessionStore().results).toHaveLength(1)

    wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    expect(useSessionStore().photo).toBeNull()
    expect(useSessionStore().results).toHaveLength(0)
    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  it('names the confirm dialog after its title', async () => {
    const wrapper = await mountSuspended(AppHeader, { route: '/results' })
    const dialog = wrapper.get('dialog')
    const titleId = dialog.attributes('aria-labelledby')
    expect(titleId).toBeTruthy()
    expect(wrapper.get(`#${titleId}`).text()).toBe('Start over?')
  })
})
