import { describe, expect, it } from 'vitest'
import { AppError, errorMessage, type ErrorCode } from '#shared/errors'

const CODES: ErrorCode[] = ['INVALID_FILE', 'QUOTA_REACHED', 'GENERATION_FAILED', 'NETWORK']

describe('errors', () => {
  it('has a user message for every code', () => {
    for (const code of CODES) expect(errorMessage(code).length).toBeGreaterThan(0)
  })

  it('tells the user to come back tomorrow when the quota is used up', () => {
    expect(errorMessage('QUOTA_REACHED')).toMatch(/tomorrow/i)
  })

  it('carries its code', () => {
    const error = new AppError('NETWORK')
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('NETWORK')
  })
})
