import { describe, expect, it } from 'vitest'
import { PROBLEMS, ROOM_TYPES, STYLES } from '#shared/catalog'

describe('catalog', () => {
  it('has exactly the four styles, each in its 2026 interpretation', () => {
    expect(Object.keys(STYLES)).toEqual(['japandi', 'scandinavian', 'industrial', 'midcentury'])
    for (const style of Object.values(STYLES)) expect(style.promptDescription).toContain('2026')
  })

  it('has the nine room types including kitchen and bathroom', () => {
    expect(Object.keys(ROOM_TYPES)).toHaveLength(9)
    expect(ROOM_TYPES).toHaveProperty('kitchen')
    expect(ROOM_TYPES).toHaveProperty('bathroom')
  })

  it('has the five problem options', () => {
    expect(Object.keys(PROBLEMS)).toEqual(['window', 'door', 'wall', 'technical', 'other'])
  })
})
