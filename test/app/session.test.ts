import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '~/stores/session'

const photo = (name = 'room.jpg') => ({ blob: new Blob(['p']), fileName: name, fileSize: 1, width: 1024, height: 672 })
const result = (style: 'japandi' | 'scandinavian') => ({
  style,
  roomType: 'living-room' as const,
  blob: new Blob(['r']),
  description: null,
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
})

describe('session store', () => {
  it('starts a fresh session when a new photo is set', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const store = useSessionStore()
    store.setPhoto(photo('a.jpg'))
    store.setAnalysis({ verdict: 'ok', warnings: [], positives: [] })
    store.setRoomType('kitchen')
    store.setStyle('japandi')
    const first = store.addResult(result('japandi'))
    store.registerReport()
    store.toggleCompare(first.id)

    store.setPhoto(photo('b.jpg'))

    expect(store.photo?.fileName).toBe('b.jpg')
    expect(store.analysis).toBeNull()
    expect(store.roomType).toBeNull()
    expect(store.style).toBeNull()
    expect(store.results).toEqual([])
    expect(store.reportCount).toBe(0)
    expect(store.compareIds).toEqual([])
    expect(revoke).toHaveBeenCalledTimes(2)
  })

  it('numbers variants per style in creation order', () => {
    const store = useSessionStore()
    store.setPhoto(photo())
    const a = store.addResult(result('japandi'))
    const b = store.addResult(result('scandinavian'))
    const c = store.addResult(result('japandi'))
    expect([a, b, c].map((r) => store.variantNumber(r.id))).toEqual([1, 1, 2])
  })

  it('gives each result an id, an object URL and a creation time', () => {
    const store = useSessionStore()
    const r = store.addResult(result('japandi'))
    expect(r.id).toBeTruthy()
    expect(r.url).toMatch(/^blob:/)
    expect(r.createdAt).toBeGreaterThan(0)
    expect(store.resultById(r.id)).toEqual(r)
  })

  it('compares at most two results and toggles them off', () => {
    const store = useSessionStore()
    const [a, b, c] = [store.addResult(result('japandi')), store.addResult(result('japandi')), store.addResult(result('japandi'))]
    store.toggleCompare(a.id)
    store.toggleCompare(b.id)
    store.toggleCompare(c.id)
    expect(store.compareIds).toEqual([a.id, b.id])
    store.toggleCompare(a.id)
    expect(store.compareIds).toEqual([b.id])
  })

  it('empties everything on reset', () => {
    const store = useSessionStore()
    store.setPhoto(photo())
    store.addResult(result('japandi'))
    store.reset()
    expect(store.photo).toBeNull()
    expect(store.results).toEqual([])
  })
})
