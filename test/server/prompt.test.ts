import { describe, expect, it } from 'vitest'
import { PROBLEMS, ROOM_TYPES, STYLES } from '#shared/catalog'
import { buildImagePrompt } from '../../server/utils/prompt'

describe('buildImagePrompt', () => {
  const prompt = buildImagePrompt({ roomType: 'bathroom', style: 'japandi' })

  it('names the room type and the style in its 2026 interpretation', () => {
    expect(prompt).toContain(ROOM_TYPES.bathroom.promptName)
    expect(prompt).toContain(STYLES.japandi.promptDescription)
  })

  it('allows window decor but keeps windows themselves', () => {
    expect(prompt).toContain('curtains, blinds')
    expect(prompt).toContain('frame colour')
  })

  it('keeps every door clear, balcony doors included', () => {
    expect(prompt).toContain('balcony doors')
  })

  it('stops mirrors from reflecting windows that are not in the photo', () => {
    expect(prompt).toContain('Mirrors reflect only this room')
  })

  it('keeps technical elements in place', () => {
    expect(prompt).toContain('water heaters')
  })

  it('does not ask for daylight, which made the model invent windows', () => {
    expect(prompt).not.toMatch(/natural daylight/i)
  })

  it('ends with the reinforcement for a reported problem', () => {
    const withProblem = buildImagePrompt({ roomType: 'bathroom', style: 'japandi', problem: 'window' })
    expect(withProblem.endsWith(PROBLEMS.window.promptReinforcement)).toBe(true)
    expect(prompt).not.toContain(PROBLEMS.window.promptReinforcement)
  })

  it('adds nothing for a problem without a reinforcement', () => {
    expect(buildImagePrompt({ roomType: 'bathroom', style: 'japandi', problem: 'other' })).toBe(prompt)
  })
})
