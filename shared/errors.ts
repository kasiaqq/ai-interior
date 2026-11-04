export type ErrorCode = 'INVALID_FILE' | 'QUOTA_REACHED' | 'GENERATION_FAILED' | 'NETWORK' | 'VERIFICATION_FAILED' | 'RATE_LIMITED'

const MESSAGES: Record<ErrorCode, string> = {
  INVALID_FILE: 'This file can’t be used. Pick a JPG, PNG or WebP photo up to 20 MB.',
  QUOTA_REACHED: 'The free daily limit is used up. Come back tomorrow to generate more.',
  GENERATION_FAILED: 'Something went wrong while restyling your room. Please try again.',
  NETWORK: 'You seem to be offline. Check your connection and try again.',
  VERIFICATION_FAILED: 'We couldn’t confirm this request came from the app. Refresh the page and try again.',
  RATE_LIMITED: 'Too many generations from your connection in the last 10 minutes. Wait a few minutes and try again.',
}

export class AppError extends Error {
  constructor(readonly code: ErrorCode) {
    super(MESSAGES[code])
    this.name = 'AppError'
  }
}

export const errorMessage = (code: ErrorCode): string => MESSAGES[code]
