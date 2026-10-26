import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseLlmJson } from '../../server/utils/llm-json'

const schema = z.object({ a: z.number() })

describe('parseLlmJson', () => {
  it('reads JSON wrapped in prose and code fences', () => {
    expect(parseLlmJson('Sure! ```json\n{"a": 1}\n``` Hope it helps.', schema)).toEqual({ a: 1 })
  })

  it('returns null for broken JSON', () => {
    expect(parseLlmJson('{"a": 1', schema)).toBeNull()
  })

  it('returns null for text without JSON', () => {
    expect(parseLlmJson('I cannot see the image.', schema)).toBeNull()
  })

  it('returns null when the shape is wrong', () => {
    expect(parseLlmJson('{"a": "one"}', schema)).toBeNull()
  })
})
