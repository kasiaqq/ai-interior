import { describe, expect, it } from 'vitest'
import { requiredRedirect } from '~/utils/steps'

const empty = { hasPhoto: false, hasRoom: false, hasStyle: false, resultIds: [] as string[] }
const full = { hasPhoto: true, hasRoom: true, hasStyle: true, resultIds: ['r1'] }

describe('requiredRedirect', () => {
  it('always allows the upload step', () => {
    expect(requiredRedirect('/', empty)).toBeNull()
  })

  it('needs a photo for the room step', () => {
    expect(requiredRedirect('/room', empty)).toBe('/')
    expect(requiredRedirect('/room', { ...empty, hasPhoto: true })).toBeNull()
  })

  it('needs a room type for the style step', () => {
    expect(requiredRedirect('/style', { ...empty, hasPhoto: true })).toBe('/')
    expect(requiredRedirect('/style', { ...empty, hasPhoto: true, hasRoom: true })).toBeNull()
  })

  it('needs a style for the generating step', () => {
    expect(requiredRedirect('/generate', { ...full, hasStyle: false })).toBe('/')
    expect(requiredRedirect('/generate', full)).toBeNull()
  })

  it('needs the result to exist for its page', () => {
    expect(requiredRedirect('/result/r1', full)).toBeNull()
    expect(requiredRedirect('/result/unknown', full)).toBe('/')
  })

  it('needs at least one result for the session page', () => {
    expect(requiredRedirect('/results', { ...full, resultIds: [] })).toBe('/')
    expect(requiredRedirect('/results', full)).toBeNull()
  })
})
