import { describe, expect, it } from 'vitest'
import { relativeTime } from '~/utils/relative-time'

const now = 1_000_000_000
describe('relativeTime', () => {
  it.each([
    [0, 'just now'],
    [59_000, 'just now'],
    [60_000, 'a minute ago'],
    [3 * 60_000, '3 minutes ago'],
    [61 * 60_000, 'an hour ago'],
    [150 * 60_000, '2 hours ago'],
  ])('%i ms ago → %s', (ago, text) => {
    expect(relativeTime(now - ago, now)).toBe(text)
  })
})
