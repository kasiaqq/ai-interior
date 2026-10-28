import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useLeaveWarning } from '~/composables/useLeaveWarning'
import { useSessionStore } from '~/stores/session'

const leave = () => {
  const event = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent
  window.dispatchEvent(event)
  return event
}

beforeEach(() => setActivePinia(createPinia()))

describe('useLeaveWarning', () => {
  it('lets the tab close freely before there is a result', () => {
    const scope = effectScope()
    scope.run(useLeaveWarning)
    expect(leave().defaultPrevented).toBe(false)
    scope.stop()
  })

  it('asks before leaving once a result exists, in every browser', async () => {
    const scope = effectScope()
    scope.run(useLeaveWarning)
    useSessionStore().addResult({ style: 'japandi', roomType: 'kitchen', blob: new Blob(['r']), description: null })
    await nextTick()
    const event = leave()
    expect(event.defaultPrevented).toBe(true)
    expect(event.returnValue).toBe('')
    scope.stop()
  })
})
